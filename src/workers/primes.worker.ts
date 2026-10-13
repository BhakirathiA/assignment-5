import { parentPort, workerData } from "worker_threads";

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

const n = Number(workerData?.n ?? 3_000_000);
const count = countPrimes(n);
parentPort?.postMessage(count);