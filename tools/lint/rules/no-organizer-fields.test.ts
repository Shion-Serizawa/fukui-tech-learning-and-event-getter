import { at, tester } from "../rule-tester.ts";
import { noOrganizerFields } from "./no-organizer-fields.ts";

tester.run("no-organizer-fields", noOrganizerFields, {
  valid: [
    {
      code: "const e = { owner_nickname: 'x', owner_display_name: 'y' };",
      filename: at("src/connpass/fixtures/events.ts"),
    },
    { code: "const e = { title: 'x', place: 'y' };", filename: at("src/connpass/parse.ts") },
  ],
  invalid: [
    {
      code: "const n = dto.owner_nickname;",
      filename: at("src/connpass/parse.ts"),
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: "interface E { ownerDisplayName: string }",
      filename: at("src/domain/event.ts"),
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: "const sql = 'SELECT owner_display_name FROM events';",
      filename: at("src/db/events.ts"),
      errors: [{ messageId: "forbidden" }],
    },
    {
      code: "const s = `by ${x} owner_nickname`;",
      filename: at("src/web/render.ts"),
      errors: [{ messageId: "forbidden" }],
    },
  ],
});
