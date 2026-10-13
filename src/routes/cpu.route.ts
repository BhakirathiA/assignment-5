import { Router } from "express";
import { Worker } from "worker_threads";
import path from "path";

export const cpuRouter = Router();

function countPrimes(n: number) {
  let c = 0;
  for (let i = 2; i <= n; i++) {
    let p = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) { p = false; break; }
    }
    if (p) c++;
  }
  return c;
}

cpuRouter.get("/blocking", (req, res) => {
  const n = Number(req.query.n ?? 3_000_000);
  const start = Date.now();
  res.json({ n, count: countPrimes(n), ms: Date.now() - start, mode: "blocking" });
});

cpuRouter.get("/worker", (req, res) => {
  const n = Number(req.query.n ?? 3_000_000);
  const start = Date.now();
  const ext = path.extname(__filename);

  const worker = new Worker(path.join(__dirname, `../workers/primes.worker${ext}`), {
    workerData: { n },
    execArgv: ext === ".ts" ? ["--import", "tsx"] : []
  });

  worker.once("message", (count) =>
    res.json({ n, count, ms: Date.now() - start, mode: "worker" })
  );
  worker.once("error", (e: Error) => res.status(500).json({ error: e.message }));
});