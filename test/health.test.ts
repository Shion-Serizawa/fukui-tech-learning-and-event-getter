import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkHealthAndNotify } from "../src/collector/health.ts";
import { commitSuccessfulRun, recordFailedRun } from "../src/db/write.ts";
import { HOUR, NOW, type Scripted, bodyText, parseLogLine, scriptedFetch } from "./fakes.ts";
import { hEvent } from "./events.ts";
import { resetDatabase } from "./reset-db.ts";

const WEBHOOK = "https://discord.com/api/webhooks/123/token";

function discord(script: readonly Scripted[], webhookUrl: string | undefined = WEBHOOK) {
  const { fetch, requests } = scriptedFetch(script);
  return {
    requests,
    deps: { db: env.DB, fetch, webhookUrl, timeoutSignal: () => new AbortController().signal },
  };
}

const ok = (): Response => new Response(null, { status: 204 });
const success = (at: number) => commitSuccessfulRun(env.DB, { startedAt: at - 1000, finishedAt: at, events: [] });

beforeEach(async () => {
  await resetDatabase(env.DB);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HLT-02: 停止通知は1回の停止につき1通", () => {
  it("成功回が一度もなければ停止通知を送り、次の回では送らない", async () => {
    const { deps, requests } = discord([ok()]);
    await checkHealthAndNotify(deps, NOW);
    await checkHealthAndNotify(deps, NOW + HOUR);
    expect(requests).toHaveLength(1);
  });

  it("最新の成功から3時間以内なら送らない。超えたら送る", async () => {
    await success(NOW);
    const { deps, requests } = discord([ok()]);
    await checkHealthAndNotify(deps, NOW + 3 * HOUR);
    expect(requests).toHaveLength(0);
    await checkHealthAndNotify(deps, NOW + 3 * HOUR + 1);
    expect(requests).toHaveLength(1);
  });

  it("本文には最終成功日時と直近の失敗の種別が入り、メンションは解釈させない（HLT-06）", async () => {
    await commitSuccessfulRun(env.DB, {
      startedAt: NOW - 1,
      finishedAt: NOW,
      events: [hEvent("1", { title: "秘密のタイトル" })],
    });
    await recordFailedRun(env.DB, {
      status: "failure",
      startedAt: NOW + HOUR,
      finishedAt: NOW + HOUR,
      fetchedCount: 0,
      failureKind: "rate_limited",
    });
    const { deps, requests } = discord([ok()]);
    await checkHealthAndNotify(deps, NOW + 4 * HOUR);

    const init = requests[0]?.init;
    expect(requests[0]?.url.href).toBe(WEBHOOK);
    expect(init?.method).toBe("POST");
    const body = parseLogLine(bodyText(requests[0]));
    expect(Object.keys(body).toSorted()).toEqual(["allowed_mentions", "content"]);
    expect(body["allowed_mentions"]).toEqual({ parse: [] });
    expect(body["content"]).toContain("直近の失敗の種別: rate_limited");
    expect(bodyText(requests[0])).not.toContain("秘密のタイトル");
  });
});

describe("HLT-03: 復旧通知", () => {
  it("停止通知を送った後に成功したら、復旧通知を1通だけ送る", async () => {
    await success(NOW);
    const { deps, requests } = discord([ok(), ok()]);
    await checkHealthAndNotify(deps, NOW + 4 * HOUR);
    await success(NOW + 5 * HOUR);
    await checkHealthAndNotify(deps, NOW + 5 * HOUR);
    await checkHealthAndNotify(deps, NOW + 6 * HOUR);

    expect(requests).toHaveLength(2);
    expect(bodyText(requests[1])).toContain("復旧しました");
  });

  it("停止通知を送っていなければ、復旧通知も送らない", async () => {
    await success(NOW);
    const { deps, requests } = discord([]);
    await checkHealthAndNotify(deps, NOW + HOUR);
    expect(requests).toHaveLength(0);
  });
});

describe("HLT-04: 送信に失敗したら次の回で再送する", () => {
  it("Webhook が 500 を返したら記録せず、次の回でもう一度送る", async () => {
    const { deps, requests } = discord([new Response("x", { status: 500 }), ok(), ok()]);
    await checkHealthAndNotify(deps, NOW);
    await checkHealthAndNotify(deps, NOW + HOUR);
    await checkHealthAndNotify(deps, NOW + 2 * HOUR);
    expect(requests).toHaveLength(2);
  });

  it("通信の例外でも投げずに終わる", async () => {
    const { deps } = discord([new TypeError("down")]);
    await expect(checkHealthAndNotify(deps, NOW)).resolves.toBeUndefined();
  });

  it("D1 が読めなくても投げずに終わる", async () => {
    await env.DB.exec("DROP TABLE notifications");
    const { deps } = discord([ok()]);
    await expect(checkHealthAndNotify(deps, NOW)).resolves.toBeUndefined();
  });
});

describe("HLT-05: 送り先の検証", () => {
  it("未設定なら送らない", async () => {
    const { deps, requests } = discord([ok()], "");
    await checkHealthAndNotify(deps, NOW);
    expect(requests).toHaveLength(0);
  });

  it("discord.com の Webhook でなければ送らない", async () => {
    const { deps, requests } = discord([ok()], "https://example.com/api/webhooks/1/x");
    await checkHealthAndNotify(deps, NOW);
    expect(requests).toHaveLength(0);
  });
});

describe("HLT-03: 30日を超える停止のあとでも復旧通知を送る", () => {
  it("成功回の掃除で、未復旧の停止の記録を消さない", async () => {
    await success(NOW);
    const { deps, requests } = discord([ok(), ok()]);
    await checkHealthAndNotify(deps, NOW + 4 * HOUR);
    const later = NOW + 31 * 24 * HOUR;
    await commitSuccessfulRun(env.DB, { startedAt: later - 1000, finishedAt: later, events: [] });
    await checkHealthAndNotify(deps, later);
    expect(requests).toHaveLength(2);
    expect(bodyText(requests[1])).toContain("復旧しました");
  });
});
