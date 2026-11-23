import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        // Worker / Pages のコード。実際の Workers ランタイム（workerd）上で走らせる。
        plugins: [
          cloudflareTest(async () => ({
            wrangler: { configPath: "./wrangler.jsonc" },
            miniflare: {
              // テストから外部へは一切通信させない。connpass API を自動テストから呼ばないことの保証（C-01, C-04）。
              outboundService: (request: Request) =>
                new Response(`外部通信はテストで遮断している: ${new URL(request.url).host}`, { status: 599 }),
              bindings: {
                TEST_MIGRATIONS: await readD1Migrations("./migrations"),
                CONNPASS_API_KEY: "test-connpass-api-key",
                DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/0/test",
              },
            },
          })),
        ],
        test: {
          name: "workers",
          include: ["src/**/*.test.ts", "test/**/*.test.ts"],
          // D1 のマイグレーションをテスト起動時に適用する。適用できること自体を毎回検証する。
          setupFiles: ["./test/apply-migrations.ts"],
        },
      },
      {
        // プロジェクト固有の lint ルール。Node 上で走らせる。
        test: {
          name: "tools",
          environment: "node",
          include: ["tools/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "istanbul",
      // 行カバレッジ 80% は Worker 側（収集・保存・RSS）のみ。描画（src/web/）は対象外（Q5=B）。
      // この下限は後から緩めない（team.md「Testing Posture」）。
      include: ["src/**/*.ts"],
      exclude: ["src/web/**", "src/**/*.test.ts", "src/connpass/fixtures/**"],
      thresholds: { lines: 80 },
    },
  },
});
