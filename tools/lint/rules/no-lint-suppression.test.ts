import { at, tester } from "../rule-tester.ts";
import { noLintSuppression } from "./no-lint-suppression.ts";

tester.run("no-lint-suppression", noLintSuppression, {
  valid: [{ code: "// 理由を説明する普通のコメント\nconst a = 1;", filename: at("src/domain/a.ts") }],
  invalid: [
    {
      code: "// oxlint-disable-next-line no-console\nconsole.log(1);",
      filename: at("src/domain/a.ts"),
      errors: [{ messageId: "lint" }],
    },
    { code: "/* eslint-disable */\nconst a = 1;", filename: at("src/db/a.ts"), errors: [{ messageId: "lint" }] },
    { code: "// @ts-expect-error\nconst a: number = 'x';", filename: at("src/db/a.ts"), errors: [{ messageId: "ts" }] },
  ],
});
