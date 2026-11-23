import { describe, expect, it } from "vitest";

// project.md Forbidden「自動テストから connpass API を呼ぶ」を、テスト環境の設定（vitest.config.ts の
// outboundService）で構造的に防いでいることの確認。
describe("テスト環境は外部へ通信できない", () => {
  it("connpass API へのリクエストは遮断される", async () => {
    const res = await fetch("https://connpass.com/api/v2/events/?prefecture=fukui");
    expect(res.status).toBe(599);
  });
});
