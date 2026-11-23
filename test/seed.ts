import { commitPrefecture, recordRun } from "../src/db/write.ts";
import { PREFECTURES, type HokurikuEvent } from "../src/domain/event.ts";

/** 3県すべてを保存できた成功回を1つ作る（収集を通さずに D1 を用意するため）。 */
export async function seedSuccessfulRun(
  db: D1Database,
  run: { readonly startedAt: number; readonly finishedAt: number; readonly events: readonly HokurikuEvent[] },
): Promise<void> {
  for (const prefecture of PREFECTURES) {
    const events = run.events.filter((e) => e.prefecture === prefecture);
    await commitPrefecture(db, { prefecture, syncedAt: run.startedAt, events });
  }
  await recordRun(db, {
    status: "success",
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    fetchedCount: run.events.length,
  });
}
