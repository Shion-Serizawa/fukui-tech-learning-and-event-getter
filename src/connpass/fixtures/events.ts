/**
 * 手で書いたフィクスチャ（project.md: 実レスポンスをコミットしない）。
 * 形は [S6]（go-connpass のモデル定義）に基づく推定。実レスポンスとの突き合わせは V-01。
 * 主催者名のフィールドは「変換で捨てられること」を確かめるためだけに入れている（値は作り物）。
 */

export const FIXTURE_OWNER_NAME = "fixture-owner-should-not-appear";

let nextId = 1000;

export function connpassEvent(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  const given = overrides["id"];
  const id = typeof given === "number" ? given : nextId++;
  return {
    id,
    title: `福井 IT 勉強会 #${id}`,
    catch: "キャッチコピー",
    description: "<p>概要（保存しない）</p>",
    event_url: `https://fukui-dev.connpass.com/event/${id}/`,
    image_url: "",
    hash_tag: "fukuidev",
    started_at: "2026-12-05T13:00:00+09:00",
    ended_at: "2026-12-05T17:00:00+09:00",
    limit: 40,
    event_type: "participation",
    open_status: "open",
    group: { id: 1, subdomain: "fukui-dev", title: "福井 Dev", url: "https://fukui-dev.connpass.com/" },
    address: "福井県福井市大手3丁目",
    place: "福井市 ○○センター",
    lat: "36.0641",
    lon: "136.2196",
    owner_id: 42,
    owner_nickname: FIXTURE_OWNER_NAME,
    owner_display_name: FIXTURE_OWNER_NAME,
    accepted: 25,
    waiting: 0,
    updated_at: "2026-11-20T10:00:00+09:00",
    ...overrides,
  };
}

export function connpassPage(
  events: readonly Record<string, unknown>[],
  options: { readonly start?: number; readonly available?: number } = {},
): Record<string, unknown> {
  return {
    results_returned: events.length,
    results_available: options.available ?? events.length,
    results_start: options.start ?? 1,
    events,
  };
}
