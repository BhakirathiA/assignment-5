import { Queue } from "bullmq";
import { bullConnection } from "../middleware/redis";

export const reminderQueue = new Queue("task-reminders", {
  connection: bullConnection
});

export async function scheduleDailyReminder() {
  await reminderQueue.upsertJobScheduler(
    "daily-reminder",
    { pattern: "0 8 * * *" },
    {
      name: "daily-reminder",
      data: {
        message: "This is your daily reminder!"
      },
      opts: {
        attempts: 5,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: 1000,
        removeOnFail: 1000
      }
    }
  );
}