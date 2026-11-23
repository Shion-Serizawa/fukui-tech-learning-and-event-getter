import { createScheduledController } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/worker.ts";
import { NOW } from "./fakes.ts";
import { resetDatabase } from "./reset-db.ts";

beforeEach(async () => {
  await resetDatabase(env.DB);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// 配線の確認。テスト環境では外部通信が遮断されている（599）ので、収集は http_error で失敗し、
// 停止通知の送信も失敗する（送信済みとして記録されない）。
describe("Cron ハンドラの配線（COL-09, HLT-04）", () => {
  it("scheduledTime を now として収集回を記録し、通知に失敗しても例外を投げない", async () => {
    const controller = createScheduledController({ scheduledTime: NOW, cron: "17 * * * *" });
    await worker.scheduled(controller, env);

    const runs = await env.DB.prepare("SELECT started_at, status, failure_kind FROM collection_runs").all();
    expect(runs.results).toEqual([{ started_at: NOW, status: "failure", failure_kind: "http_error" }]);
    const notified = await env.DB.prepare("SELECT key FROM notifications").all();
    expect(notified.results).toEqual([]);
  });
});

describe("COL-06: API キーが未設定なら connpass を呼ばない", () => {
  it("シークレットが undefined のとき、収集回を記録せず設定不備のログを出す", async () => {
    const errors: string[] = [];
    vi.spyOn(console, "error").mockImplementation((line: string) => errors.push(line));
    const withoutKey: Env = { ...env };
    Reflect.deleteProperty(withoutKey, "CONNPASS_API_KEY");
    await worker.scheduled(createScheduledController({ scheduledTime: NOW, cron: "17 * * * *" }), withoutKey);

    const runs = await env.DB.prepare("SELECT * FROM collection_runs").all();
    expect(runs.results).toEqual([]);
    expect(errors.some((l) => l.includes("collect.misconfigured"))).toBe(true);
  });
});
