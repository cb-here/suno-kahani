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

  // Store client responses
  const clients = new Set();

  activeStreams.set(streamId, { sentences, voice, clients, index: 0 });

  // Send stream ID to frontend
  res.json({ streamId });

  (async () => {
    for (let i = 0; i < sentences.length; i++) {
      try {
        const tts = new UniversalEdgeTTS(sentences[i], voice);
        const result = await tts.synthesize();
        const arrayBuffer = await result.audio.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString("base64");

        const payload = JSON.stringify({
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

        await new Promise((r) => setTimeout(r, 400)); // natural pause
      } catch (err) {
        console.error(err);
      }
    }

    for (const clientRes of clients) {
      clientRes.write("event: done\ndata: finished\n\n");
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

  stream.clients.add(res);

  req.on("close", () => {
    stream.clients.delete(res);
    if (stream.clients.size === 0) {
      activeStreams.delete(id);
    }
  });

  if (stream.index > 0) {
    res.write(`data: ${JSON.stringify({ resumeFrom: stream.index })}\n\n`);
  }
});

app.post("/translate", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ error: "Text required" });
    }

    const lines = text.split("\n").filter(Boolean);
    const finalOutput = [];

    for (const line of lines) {
      const isHinglish = /^[a-zA-Z0-9\s,.'!?-]+$/.test(line);

      let hindi = "";

      if (isHinglish) {
        const url = `https://inputtools.google.com/request?itc=hi-t-i0-und&text=${encodeURIComponent(
          line
        )}`;
        const res2 = await fetch(url);
        const data = await res2.json();
        hindi = data?.[1]?.[0]?.[1]?.[0] || line;
      } else {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(
          line
        )}`;
        const res3 = await fetch(url);
        const data = await res3.json();
        hindi = data[0].map((t) => t[0]).join("");
      }

      finalOutput.push(hindi);
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

app.listen(4000, () => {
  console.log("server is running on: http://localhost:4000");
});
