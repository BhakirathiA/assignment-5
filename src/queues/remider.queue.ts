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
      data: {},
      opts: {
        removeOnComplete: 1000,
        removeOnFail: 1000
      }
    }
  );
}