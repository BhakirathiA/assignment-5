import dotenv from "dotenv";
import "reflect-metadata";
import express from "express";
import http from "http";
import fs from "fs";
import pinoHttp from "pino-http";
import { AppDataSource } from "./config/data-source";
import { redis } from "./config/redis";
import { logger } from "./config/logger";
import { initIO, closeIO } from "./socket/io";
import { createReminderWorker } from "./queues/reminder.worker";
import { reminderQueue, scheduleDailyReminder } from "./queues/remider.queue";
import { UPLOAD_DIR } from "./middleware/upload";
import { errorHandler } from "./middleware/error";
import router from "./routes";
dotenv.config();

async function bootstrap() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  await AppDataSource.initialize();

  const reminderWorker = createReminderWorker();
  await scheduleDailyReminder();

  const app = express();
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use(express.static("public"));

  app.get("/", (_req, res) => res.send("Day 5 API is running"));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", router);
  app.use(errorHandler);

  const server = http.createServer(app);
  initIO(server);

  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => logger.info(`Server running on ${port}`));

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Graceful shutdown started");

    setTimeout(() => {
      logger.error("Forced exit after timeout");
      process.exit(1);
    }, 10_000).unref();

    try {
      await closeIO();
      if (server.listening) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
      await reminderWorker.close();
      await reminderQueue.close();
      await redis.quit();
      await AppDataSource.destroy();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "Failed to start");
  process.exit(1);
});