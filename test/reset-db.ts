import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

/**
 * テストの間でデータを持ち越さないため、すべてのテーブルを消してマイグレーションを適用し直す。
 * D1 のストレージはテストごとには分離されない。DROP TABLE で障害を再現するテストの後始末も兼ねる。
 */
export async function resetDatabase(db: D1Database): Promise<void> {
  await db.exec(
    "DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS collection_runs; DROP TABLE IF EXISTS notifications; DROP TABLE IF EXISTS prefecture_syncs; DROP TABLE IF EXISTS d1_migrations;",
  );
  await applyD1Migrations(db, env.TEST_MIGRATIONS);
}
