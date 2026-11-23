import { readSnapshot } from "../../src/db/read.ts";
import { selectFeedEvents } from "../../src/domain/listing.ts";
import { renderFeed } from "../../src/feed/rss.ts";
import { logError } from "../../src/log.ts";

/** GET /feed.xml（F-02 RSS）。認証はしない（C-13 の変更）。 */
export async function respondFeed(db: D1Database, now: number, siteUrl: string): Promise<Response> {
  let body: string;
  try {
    const snapshot = await readSnapshot(db, now);
    body = renderFeed({ events: selectFeedEvents(snapshot.events, now), now, siteUrl });
  } catch {
    // RSS-09: 空のフィードを返すと、RSS リーダーは「0件になった」と解釈する。
    logError("feed.read_failed", { kind: "storage_error" });
    return new Response("Service Unavailable", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
  return new Response(body, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}

export const onRequestGet: PagesFunction<Env> = (context) =>
  respondFeed(context.env.DB, Date.now(), new URL(context.request.url).origin);
