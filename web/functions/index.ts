import { readSnapshot } from "../../src/db/read.ts";
import { buildListing } from "../../src/domain/listing.ts";
import { logError } from "../../src/log.ts";
import { withSecurityHeaders } from "../../src/web/security-headers.ts";
import { renderPage } from "../../src/web/render.ts";

/**
 * GET /（F-01 公開一覧）。現在時刻と env を読んでよいのはエントリポイントだけ。
 * D1 は読み取り専用のクエリ（src/db/read.ts）だけを使う。
 */
export async function respondPage(db: D1Database, now: number): Promise<Response> {
  let body: string;
  try {
    const snapshot = await readSnapshot(db, now);
    body = renderPage({
      kind: "ok",
      listing: buildListing(snapshot.events, now),
      lastSuccessFinishedAt: snapshot.lastSuccessFinishedAt,
    });
  } catch {
    // WEB-11: 「0件」と同じ見え方にしない。原因は画面に出さない。
    logError("web.read_failed", { kind: "storage_error" });
    return new Response(renderPage({ kind: "error" }), {
      status: 503,
      headers: withSecurityHeaders({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }),
    });
  }
  return new Response(body, {
    headers: withSecurityHeaders({
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    }),
  });
}

export const onRequestGet: PagesFunction<Env> = (context) => respondPage(context.env.DB, Date.now());
