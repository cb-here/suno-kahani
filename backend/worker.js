// worker.js
const { parentPort, workerData } = require("worker_threads");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function runPiper(text, modelPath, tmpDir) {
  return new Promise((resolve, reject) => {
    const outFile = path.join(
      tmpDir,
      `piper_${Date.now()}_${Math.random().toString(36).slice(2)}.wav`
    );

    const child = spawn(workerData.piperPath, [
      "--model",
      modelPath,
      "--output_file",
      outFile,
      "--speaker",
      "0",
      "--length_scale",
      "1",
      "--noise_scale",
      "0.5",
      "--noise_w",
      "0.6",
    ]);

    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.stdin.write(text);
    child.stdin.end();

    child.on("close", (code) => {
      if (code !== 0) {
        try { fs.unlinkSync(outFile); } catch {}
        return reject(`Piper failed: ${stderr}`);
      }
      try {
        const wav = fs.readFileSync(outFile);
        fs.unlinkSync(outFile);
        resolve(wav.toString("base64"));
      } catch (err) {
        reject(`Read error: ${err.message}`);
      }
    });

    child.on("error", (err) => reject(err));
  });
}

parentPort.on("message", async (payload) => {
  try {
    const { text, modelPath, tmpDir } = payload;
    const base64 = await runPiper(text, modelPath, tmpDir);
    parentPort.postMessage({ ok: true, base64 });
  } catch (err) {
    parentPort.postMessage({ ok: false, error: err.toString() });
  }
});
