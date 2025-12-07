// pool.js
const { Worker } = require("worker_threads");
const os = require("os");
const path = require("path");

class WorkerPool {
  constructor(workerFile, opts) {
    this.workerFile = workerFile;
    this.opts = opts;
    this.size = os.cpus().length;
    this.idle = [];
    this.busy = new Set();
    this.queue = [];
    this._createWorkers();
  }

  _createWorkers() {
    for (let i = 0; i < this.size; i++) {
      this._spawn();
    }
  }

  _spawn() {
    const worker = new Worker(this.workerFile, {
      workerData: {
        piperPath: this.opts.piperPath,
      },
    });

    worker.on("message", (msg) => {
      if (worker._resolve) {
        worker._resolve(msg);
        worker._resolve = null;
      }
      this.busy.delete(worker);
      this.idle.push(worker);
      this._runNext();
    });

    worker.on("error", (err) => {
      console.error("Worker error:", err);
      this.busy.delete(worker);
      this._spawn();
    });

    worker.on("exit", () => {
      this.busy.delete(worker);
      const idx = this.idle.indexOf(worker);
      if (idx !== -1) this.idle.splice(idx, 1);
      this._spawn();
    });

    this.idle.push(worker);
  }

  runTask(payload) {
    return new Promise((resolve) => {
      this.queue.push({ payload, resolve });
      this._runNext();
    });
  }

  _runNext() {
    if (this.queue.length === 0 || this.idle.length === 0) return;

    const worker = this.idle.pop();
    const { payload, resolve } = this.queue.shift();

    worker._resolve = resolve;
    this.busy.add(worker);

    worker.postMessage({
      ...payload,
      tmpDir: this.opts.tmpDir,
    });
  }
}

module.exports = { WorkerPool };
