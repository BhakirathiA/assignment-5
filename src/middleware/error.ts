import { ErrorRequestHandler } from "express";
import multer from "multer";
import { logger } from "../config/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err?.message === "Unsupported file type") {
    return res.status(400).json({ error: err.message });
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
};