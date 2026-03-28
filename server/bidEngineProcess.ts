/**
 * Bid Engine Process Manager
 * Starts the FastAPI bid scoring microservice as a child process alongside Express.
 * The process is restarted on crash and killed when the Node process exits.
 */

import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BID_ENGINE_PORT = parseInt(process.env.BID_ENGINE_PORT ?? "8001", 10);
const BID_ENGINE_DIR = path.join(__dirname, "bid_engine");
const PYTHON_CMD = process.env.PYTHON_CMD ?? "/usr/bin/python3.11";

let bidEngineProcess: ChildProcess | null = null;
let restartCount = 0;
const MAX_RESTARTS = 5;

export function startBidEngine(): void {
  if (restartCount >= MAX_RESTARTS) {
    console.warn("[BidEngine] Max restarts reached. Bid engine disabled.");
    return;
  }

  console.log(`[BidEngine] Starting FastAPI bid engine on port ${BID_ENGINE_PORT}...`);

  // Clear Python 3.13 env vars injected by the Manus sandbox that cause
  // SRE module mismatch when python3.11 inherits them.
  const cleanEnv = { ...process.env };
  delete cleanEnv.PYTHONHOME;
  delete cleanEnv.PYTHONPATH;
  cleanEnv.BID_ENGINE_PORT = String(BID_ENGINE_PORT);

  bidEngineProcess = spawn(
    PYTHON_CMD,
    ["main.py"],
    {
      cwd: BID_ENGINE_DIR,
      env: cleanEnv,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  bidEngineProcess.stdout?.on("data", (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.log(`[BidEngine] ${line}`);
  });

  bidEngineProcess.stderr?.on("data", (data: Buffer) => {
    const line = data.toString().trim();
    if (line && !line.includes("INFO:")) console.error(`[BidEngine] ${line}`);
  });

  bidEngineProcess.on("exit", (code, signal) => {
    console.warn(`[BidEngine] Process exited (code=${code}, signal=${signal}). Restarting in 3s...`);
    bidEngineProcess = null;
    restartCount++;
    setTimeout(startBidEngine, 3000);
  });

  bidEngineProcess.on("error", (err) => {
    console.error(`[BidEngine] Failed to start: ${err.message}`);
  });
}

export function stopBidEngine(): void {
  if (bidEngineProcess) {
    console.log("[BidEngine] Stopping...");
    bidEngineProcess.removeAllListeners("exit"); // prevent restart on intentional stop
    bidEngineProcess.kill("SIGTERM");
    bidEngineProcess = null;
  }
}

// Graceful shutdown hooks
process.on("exit", stopBidEngine);
process.on("SIGINT", () => { stopBidEngine(); process.exit(0); });
process.on("SIGTERM", () => { stopBidEngine(); process.exit(0); });
