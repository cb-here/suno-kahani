// server.js (CommonJS)

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { WorkerPool } = require("./pool.js");

const app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" }));

console.log("Using __dirname:", __dirname);

// Paths - use environment variable or detect platform
const PIPER_PATH = process.env.PIPER_PATH || path.join(
  __dirname,
  "piper",
  process.platform === "win32" ? "piper.exe" : "piper"
);
const TMP_DIR = path.join(__dirname, "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Voice model loader
function getVoiceModel(v) {
  return (
    {
      rohan: "hi_IN-rohan-medium.onnx",
      priyamvada: "hi_IN-priyamvada-medium.onnx",
      pratham: "hi_IN-pratham-medium.onnx",
      ryan: "en_US-ryan-medium.onnx",
      kristin: "en_US-kristin-medium.onnx",
    }[v] || "hi_IN-rohan-medium.onnx"
  );
}

// Create worker pool with more workers for faster parallel processing
const pool = new WorkerPool(path.join(__dirname, "worker.js"), {
  piperPath: PIPER_PATH,
  tmpDir: TMP_DIR,
  maxWorkers: 4, // Increase this if you have more CPU cores
});

// Split text into sentences
function splitIntoSentences(text) {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[।.!?])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Parse WAV header and extract audio data
function parseWavBuffer(buffer) {
  const header = {
    audioFormat: buffer.readUInt16LE(20),
    numChannels: buffer.readUInt16LE(22),
    sampleRate: buffer.readUInt32LE(24),
    byteRate: buffer.readUInt32LE(28),
    blockAlign: buffer.readUInt16LE(32),
    bitsPerSample: buffer.readUInt16LE(34),
  };

  // Find the data chunk
  let dataOffset = 36;
  while (dataOffset < buffer.length - 8) {
    const chunkId = buffer.toString("ascii", dataOffset, dataOffset + 4);
    if (chunkId === "data") {
      break;
    }
    const chunkSize = buffer.readUInt32LE(dataOffset + 4);
    dataOffset += 8 + chunkSize;
  }

  const dataSize = buffer.readUInt32LE(dataOffset + 4);
  const audioData = buffer.slice(dataOffset + 8, dataOffset + 8 + dataSize);

  return { header, audioData, headerSize: dataOffset + 8 };
}

// Create WAV header
function createWavHeader(dataSize, sampleRate, numChannels, bitsPerSample) {
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return header;
}

// Merge multiple WAV buffers properly
function mergeWavBuffers(buffers) {
  if (buffers.length === 0) return null;
  if (buffers.length === 1) return buffers[0];

  const firstWav = parseWavBuffer(buffers[0]);
  const { header } = firstWav;

  const audioDataChunks = buffers.map((buf) => parseWavBuffer(buf).audioData);
  const mergedAudioData = Buffer.concat(audioDataChunks);

  const newHeader = createWavHeader(
    mergedAudioData.length,
    header.sampleRate,
    header.numChannels,
    header.bitsPerSample,
  );

  return Buffer.concat([newHeader, mergedAudioData]);
}

// Process in batches for better performance
async function processBatches(sentences, modelPath, batchSize = 10) {
  const results = [];

  for (let i = 0; i < sentences.length; i += batchSize) {
    const batch = sentences.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sentences.length / batchSize)}`,
    );

    const batchResults = await Promise.all(
      batch.map((s) => pool.runTask({ text: s, modelPath })),
    );

    results.push(...batchResults);
  }

  return results;
}

// ------------------------------------------------------
//  FAST STREAMING ENDPOINT  (SSE + Parallel Workers)
// ------------------------------------------------------
app.post("/tts/stream", async (req, res) => {
  const { text, voice } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text missing" });
  }

  const model = getVoiceModel(voice);
  const modelPath = path.join(__dirname, "piper", model);

  const sentences = splitIntoSentences(text);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let nextIndexToSend = 0;
  const buffer = {};

  const promises = sentences.map((sentence, idx) =>
    pool.runTask({ text: sentence, modelPath }).then((data) => ({
      idx,
      sentence,
      data,
    })),
  );

  promises.forEach((p) =>
    p.then(({ idx, sentence, data }) => {
      buffer[idx] = { sentence, data };

      while (buffer[nextIndexToSend]) {
        const item = buffer[nextIndexToSend];

        if (!item.data.ok) {
          res.write(
            `data: ${JSON.stringify({
              chunk: nextIndexToSend,
              error: item.data.error,
            })}\n\n`,
          );
        } else {
          res.write(
            `data: ${JSON.stringify({
              chunk: nextIndexToSend,
              total: sentences.length,
              audio: item.data.base64,
              sentence: item.sentence,
            })}\n\n`,
          );
        }

        delete buffer[nextIndexToSend];
        nextIndexToSend++;
      }
    }),
  );

  Promise.all(promises).then(() => {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  });
});


app.listen(4000, () => {
  console.log("🚀 FAST TTS (CommonJS) running at http://localhost:4000");
});
