import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

// Worker は HTTP で何も公開しない。公開面に connpass の中継経路を作らないことの恒久的な回帰テスト。
describe("RSS-02: Worker はどのパスにも 404 を返す", () => {
  const cases = ["/", "/feed.xml", "/api/v2/events/", "/__scheduled", "/collect"];
  for (const path of cases) {
    it(`GET ${path}`, async () => {
      const res = await exports.default.fetch(new Request(`https://example.com${path}`));
      expect(res.status).toBe(404);
    });
  }
});
