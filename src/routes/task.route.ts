import { Router } from "express";
import { ObjectId } from "mongodb";
import path from "path";
import { AppDataSource } from "../config/data-source";
import { Task } from "../entities/task";
import { upload, UPLOAD_DIR } from "../middleware/upload";
import { emitTaskEvent } from "../socket/io";
import { cache, invalidate } from "../middleware/cache";

export const tasksRouter = Router();
const repo = () => AppDataSource.getMongoRepository(Task);
const REDIS_KEY = "tasks:heavy";

const toId = (id: string | string[] | undefined) => {
  const value = Array.isArray(id) ? id[0] : id;
  return value && ObjectId.isValid(value) ? new ObjectId(value) : null;
};

tasksRouter.get("/heavy", cache(REDIS_KEY, 60*60), async (_req, res) => {
  const tasks = await repo().find();
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  res.json({ total, completed, pending: total - completed, generatedAt: new Date().toISOString() });
});

tasksRouter.get("/", async (_req, res) => {
  res.json(await repo().find());
});

tasksRouter.post("/", async (req, res) => {
  const { title, dueDate } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "title is required" });

  const task = repo().create({
    title,
    completed: false,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    attachments: []
  });
  await repo().save(task);
  await invalidate(REDIS_KEY);
  emitTaskEvent("task:created", task);
  res.status(201).json(task);
});

tasksRouter.patch("/:id", async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ error: "invalid id" });

  const task = await repo().findOneBy({ _id } as any);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const wasCompleted = task.completed;
  const { title, completed, dueDate } = req.body ?? {};
  if (title !== undefined) task.title = title;
  if (completed !== undefined) task.completed = Boolean(completed);
  if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;

  await repo().save(task);
  await invalidate(REDIS_KEY);
  emitTaskEvent(!wasCompleted && task.completed ? "task:completed" : "task:updated", task);
  res.json(task);
});

tasksRouter.post("/:id/attachments", upload.array("files", 3), async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ error: "invalid id" });

  const task = await repo().findOneBy({ _id } as any);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const files = ((req.files as Express.Multer.File[]) ?? []).map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    mimeType: f.mimetype,
    size: f.size
  }));
  if (!files.length) return res.status(400).json({ error: "No files uploaded" });

  task.attachments = [...(task.attachments ?? []), ...files];
  await repo().save(task);
  await invalidate(REDIS_KEY);
  emitTaskEvent("task:updated", task);
  res.status(201).json(files);
});

tasksRouter.get("/:id/attachments/:filename", async (req, res) => {
  const _id = toId(req.params.id);
  if (!_id) return res.status(400).json({ error: "invalid id" });

  const task = await repo().findOneBy({ _id } as any);
  const att = task?.attachments?.find((a) => a.filename === req.params.filename);
  if (!att) return res.status(404).json({ error: "Attachment not found" });

  res.download(path.join(UPLOAD_DIR, path.basename(att.filename)), att.originalName);
});