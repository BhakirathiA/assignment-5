import dotenv from "dotenv";
import Redis from "ioredis";
dotenv.config();

const url = new URL(process.env.REDIS_URL!);

export const bullConnection = {
  host: url.hostname,
  port: Number(url.port || 6379),
  username: decodeURIComponent(url.username) || "default",
  password: decodeURIComponent(url.password),
  tls: {},                      
  maxRetriesPerRequest: null as null
};

export const redis = new Redis({
  host: url.hostname,
  port: Number(url.port || 6379),
  username: decodeURIComponent(url.username) || "default",
  password: decodeURIComponent(url.password),
  tls: {}
});

redis.on("error", (e) => console.error("redis error:", e.message));