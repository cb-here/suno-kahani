const express = require("express");
const cors = require("cors");
const { UniversalEdgeTTS } = require("edge-tts-universal");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// In-memory store for active streams
const activeStreams = new Map();

app.post("/start-tts", async (req, res) => {
  const { text, voice = "hi-IN-MadhurNeural" } = req.body;
  if (!text) return res.status(400).json({ error: "Text bhej bhai" });

  const streamId = uuidv4();
  const sentences = text
    .split(/(?<=[.!?।])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const clients = new Set();

  activeStreams.set(streamId, { sentences, voice, clients, index: 0 });

  // Send ID
  res.json({ streamId });

  (async () => {
    for (let i = 0; i < sentences.length; i++) {
      try {
        const tts = new UniversalEdgeTTS(sentences[i], voice);

        const result = await tts.synthesize();

        if (!result || !result.audio) {
          console.log("Invalid result, skipping");
          continue;
        }

        const arrayBuffer = await result.audio.arrayBuffer();
        const size = arrayBuffer.byteLength;

        // REAL partial detection
        if (size < 5000) {
          console.log("Skipping tiny partial packet:", size);
          continue;
        }

        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString("base64");

        const payload = JSON.stringify({
          chunkId: `${streamId}-${i}`,
          index: i,
          total: sentences.length,
          text: sentences[i],
          audio: base64Audio,
        });

        for (const clientRes of clients) {
          clientRes.write(`data: ${payload}\n\n`);
        }

        activeStreams.set(streamId, {
          ...activeStreams.get(streamId),
          index: i + 1,
        });
      } catch (err) {
        console.error("TTS error:", err);
      }
    }

    // STREAM DONE
    for (const clientRes of clients) {
      clientRes.write(`event: done\ndata: finished\n\n`);
      clientRes.end();
    }

    activeStreams.delete(streamId);
  })();
});
// SSE endpoint
app.get("/stream/:id", (req, res) => {
  const { id } = req.params;
  const stream = activeStreams.get(id);

  if (!stream) {
    return res.status(404).send("Stream khatam ho gaya ya galat ID");
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  if (stream.clients.has(res)) {
    console.log("Client already connected — ignoring duplicate");
    res.end();
    return;
  }

  stream.clients.add(res);

  req.on("close", () => {
    stream.clients.delete(res);
    if (stream.clients.size === 0) {
      activeStreams.delete(id);
    }
  });

  if (stream.index > 0) {
    res.write(`event: resume\ndata: ${stream.index}\n\n`);
  }
});

function chunkWords(line, size = 10) {
  const words = line.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}

app.post("/translate", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: "Text required" });
    }

    const lines = text.split("\n").filter(Boolean);
    const finalOutput = [];

    for (const line of lines) {
      const chunks = chunkWords(line, 10);
      let roughHindi = "";

      for (const ch of chunks) {
        const url1 = `https://inputtools.google.com/request?itc=hi-t-i0-und&text=${encodeURIComponent(
          ch
        )}`;
        const r1 = await fetch(url1);
        const d1 = await r1.json();

        const part = d1?.[1]?.[0]?.[1]?.[0] || ch;
        roughHindi += part + " ";
      }

      const url2 = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(
        roughHindi.trim()
      )}`;

      const r2 = await fetch(url2);
      const d2 = await r2.json();

      const final = d2[0].map((t) => t[0]).join("");

      finalOutput.push(final.trim());
    }

    res.json({
      success: true,
      original: text,
      translated: finalOutput.join("\n"),
    });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation error" });
  }
});

app.post("/translate/english", async (req, res) => {
  try {
    let { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "Text required" });
    }

    const lines = text.split("\n").filter(Boolean);
    const finalOutput = [];

    for (const line of lines) {
      const chunks = chunkWords(line, 10);
      let hindiLine = "";

      for (const ch of chunks) {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(
          ch
        )}`;

        const r = await fetch(url);
        const d = await r.json();

        const part = d[0].map((t) => t[0]).join("");
        hindiLine += part + " ";
      }

      finalOutput.push(hindiLine.trim());
    }

    res.json({
      success: true,
      source: "english",
      original: text,
      translated: finalOutput.join("\n"),
    });
  } catch (err) {
    console.error("English Translation error:", err);
    res.status(500).json({ error: "Translation error" });
  }
});

app.listen(4000, () => {
  console.log("server is running on: http://localhost:4000");
});
