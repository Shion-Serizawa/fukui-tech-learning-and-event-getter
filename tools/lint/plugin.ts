import { importBoundaries } from "./rules/import-boundaries.ts";
import { noAmbientClock } from "./rules/no-ambient-clock.ts";
import { noGlobalEnv } from "./rules/no-global-env.ts";
import { noFetchOutsideClients } from "./rules/no-fetch-outside-clients.ts";
import { noLintSuppression } from "./rules/no-lint-suppression.ts";
import { noOrganizerFields } from "./rules/no-organizer-fields.ts";
import { noRawMarkup } from "./rules/no-raw-markup.ts";
import { noSqlOutsideDb } from "./rules/no-sql-outside-db.ts";

export default {
  meta: { name: "hokuriku" },
  rules: {
    "import-boundaries": importBoundaries,
    "no-ambient-clock": noAmbientClock,
    "no-fetch-outside-clients": noFetchOutsideClients,
    "no-global-env": noGlobalEnv,
    "no-lint-suppression": noLintSuppression,
    "no-organizer-fields": noOrganizerFields,
    "no-raw-markup": noRawMarkup,
    "no-sql-outside-db": noSqlOutsideDb,
  },
};
