import dotenv from "dotenv";
import { Worker } from "bullmq";
import { Resend } from "resend";
import pino from "pino";
import { AppDataSource } from "../config/data-source";
import { Task } from "../entities/task";
import { bullConnection } from "../middleware/redis";
dotenv.config();

const logger = pino({ name: "reminder.worker" });

const resend = new Resend(process.env.RESEND_API_KEY);

function buildMessage(tasks: Task[]) {
  return tasks
    .map((t) => `- ${t.title} (${t.dueDate ? new Date(t.dueDate).toISOString() : "no date"})`)
    .join("\n");
}

export function createReminderWorker() {
  const worker = new Worker(
    "task-reminders",
    async () => {
      logger.info("Reminder worker tick started");

      const repo = AppDataSource.getMongoRepository(Task);
      const now = new Date();
      const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const tasks = await repo.find({
        where: {
          completed: false,
          dueDate: {
            $gte: now,
            $lte: soon
          }
        } as any,
        select: {
            title: true,
            dueDate: true
        }
      });

      logger.info({ count: tasks.length }, "Due-soon tasks found");
      if (!tasks.length) return;

      const to = process.env.REMINDER_TO || "test@local.dev";
      const html = `<pre>${buildMessage(tasks)}</pre>`;

      const result = await resend.emails.send({
        from: "onboarding@resend.dev",
        to,
        subject: "Tasks due soon",
        html
      });

      logger.info(
        { count: tasks.length, id: result.data?.id, to:to },
        "Reminder email sent via Resend",
      );
    },
    { connection: bullConnection }
  );

  worker.on("failed", (job, err) =>
    logger.error({ jobId: job?.id, err }, "Job failed")
  );
  worker.on("error", (err) => logger.error({ err }, "Worker error"));

  return worker;
}