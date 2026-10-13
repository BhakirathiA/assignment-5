import { Request, Response, NextFunction, RequestHandler } from "express";
import { redis } from "../config/redis";

export const cache = (key: string, ttlSeconds = 60): RequestHandler => {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const hit = await redis.get(key);
      if (hit) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(hit));
      }

      const originalJson = res.json.bind(res);
      res.json = ((body: any) => {
        void redis.set(key, JSON.stringify(body), "EX", ttlSeconds);
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      }) as Response["json"];

      next();
    } catch {
      next();
    }
  };
};

export const invalidate = async (key: string) => {
  try {
    await redis.del(key);
  } catch {
    throw new Error(`Failed to invalidate cache for key: ${key}`);
  }
};