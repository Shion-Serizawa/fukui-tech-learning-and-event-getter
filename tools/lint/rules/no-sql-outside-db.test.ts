import { at, tester } from "../rule-tester.ts";
import { noSqlOutsideDb } from "./no-sql-outside-db.ts";

tester.run("no-sql-outside-db", noSqlOutsideDb, {
  valid: [
    { code: "env.DB.prepare('SELECT * FROM events').all();", filename: at("test/collect.test.ts") },
    { code: "db.prepare('SELECT 1').all();", filename: at("src/db/events.ts") },
    { code: "await db.batch([a, b]);", filename: at("src/db/events.test.ts") },
    { code: "const events = await listEvents(env.DB, now);", filename: at("web/functions/index.ts") },
  ],
  invalid: [
    { code: "env.DB.prepare('SELECT 1').all();", filename: at("src/worker.ts"), errors: [{ messageId: "forbidden" }] },
    { code: "await env.DB.batch([]);", filename: at("web/functions/index.ts"), errors: [{ messageId: "forbidden" }] },
    {
      code: "await db.prepare('DELETE FROM events').run();",
      filename: at("src/collector/collect.ts"),
      errors: [{ messageId: "forbidden" }],
    },
  ],
});
