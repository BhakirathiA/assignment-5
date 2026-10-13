import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import { Task } from "../entities/task";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/day5db",
  entities: [Task],
  synchronize: true
});