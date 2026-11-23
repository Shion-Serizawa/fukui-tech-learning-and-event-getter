import { at, tester } from "../rule-tester.ts";
import { noGlobalEnv } from "./no-global-env.ts";

tester.run("no-global-env", noGlobalEnv, {
  valid: [
    { code: "import { env } from 'cloudflare:workers';", filename: at("src/db/schema.test.ts") },
    { code: "import { env } from 'cloudflare:workers';", filename: at("test/apply-migrations.ts") },
    { code: "import { DurableObject } from 'cloudflare:workers';", filename: at("src/worker.ts") },
  ],
  invalid: [
    {
      code: "import { env } from 'cloudflare:workers';",
      filename: at("src/connpass/client.ts"),
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: "import { env as e } from 'cloudflare:workers';",
      filename: at("src/worker.ts"),
      errors: [{ messageId: "forbidden" }],
    },
  ],
});
