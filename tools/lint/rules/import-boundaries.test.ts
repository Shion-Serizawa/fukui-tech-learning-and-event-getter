import { at, tester } from "../rule-tester.ts";
import { importBoundaries } from "./import-boundaries.ts";

tester.run("import-boundaries", importBoundaries, {
  valid: [
    { code: "import { Event } from '../domain/event.ts';", filename: at("src/connpass/parse.ts") },
    { code: "import { fetchEvents } from '../connpass/index.ts';", filename: at("src/collector/collect.ts") },
    {
      code: "import { fixture } from '../connpass/fixtures/events.ts';",
      filename: at("src/collector/collect.test.ts"),
    },
    { code: "import type { EventDto } from './dto.ts';", filename: at("src/connpass/parse.ts") },
    { code: "import { listEvents } from '../../src/db/events.ts';", filename: at("web/functions/index.ts") },
    { code: "import { renderPage } from '../../src/web/render.ts';", filename: at("web/functions/index.ts") },
    { code: "import { renderFeed } from '../../src/feed/rss.ts';", filename: at("web/functions/feed.xml.ts") },
    { code: "import { notifyStale } from '../notify/discord.ts';", filename: at("src/collector/health.ts") },
    { code: "import { env } from 'cloudflare:workers';", filename: at("src/db/events.ts") },
    { code: "import { describe } from 'vitest';", filename: at("src/domain/window.test.ts") },
    { code: "import { seed } from '../../test/seed.ts';", filename: at("src/web/render.test.ts") },
    { code: "import { x } from './other.ts';", filename: at("src/domain/window.ts") },
    { code: "import { x } from './other.ts';", filename: at("vitest.config.ts") },
  ],
  invalid: [
    {
      code: "import { fetchEvents } from '../../src/connpass/client.ts';",
      filename: at("web/functions/index.ts"),
      errors: [{ messageId: "layer" }],
    },
    {
      code: "import { upsert } from '../db/events.ts';",
      filename: at("src/web/render.ts"),
      errors: [{ messageId: "layer" }],
    },
    {
      code: "import { Dto } from '../connpass/dto.ts';",
      filename: at("src/domain/event.ts"),
      errors: [{ messageId: "layer" }],
    },
    {
      code: "import { collect } from '../collector/collect.ts';",
      filename: at("src/feed/rss.ts"),
      errors: [{ messageId: "layer" }],
    },
    {
      code: "import type { EventDto } from '../connpass/dto.ts';",
      filename: at("src/collector/collect.ts"),
      errors: [{ messageId: "entry" }],
    },
    {
      code: "import { notifyStale } from '../../src/notify/discord.ts';",
      filename: at("web/functions/index.ts"),
      errors: [{ messageId: "layer" }],
    },
    { code: "import { z } from 'zod';", filename: at("src/domain/event.ts"), errors: [{ messageId: "pure" }] },
    {
      code: "import { seed } from '../../test/seed.ts';",
      filename: at("src/db/events.ts"),
      errors: [{ messageId: "testHelper" }],
    },
    { code: "export * from '../db/events.ts';", filename: at("src/feed/index.ts"), errors: [{ messageId: "layer" }] },
  ],
});
