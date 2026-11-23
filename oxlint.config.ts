import { defineConfig } from "oxlint";

// リントは厳しめにする（team.md「Code Style」Q13）。機械が見られる部分は機械に見させる。
// エージェントの誤りを直したら、まずここ（またはプロジェクト固有ルール tools/lint/）に落とせないかを考える。
// ルールの一覧と、どの規則をどの仕組みで強制しているかは docs/spec/05-architecture.md にある。
export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "import", "promise", "vitest"],
  jsPlugins: ["./tools/lint/plugin.ts"],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  options: {
    typeAware: true,
    denyWarnings: true,
    reportUnusedDisableDirectives: "error",
  },
  ignorePatterns: [
    "worker-configuration.d.ts",
    "web/worker-configuration.d.ts",
    "coverage/**",
    "**/.wrangler/**",
    ".claude/**",
    "aidlc/**",
    ".cache/**",
  ],
  rules: {
    // --- プロジェクト固有（tools/lint/）---
    "hokuriku/import-boundaries": "error",
    "hokuriku/no-ambient-clock": "error",
    "hokuriku/no-fetch-outside-clients": "error",
    "hokuriku/no-global-env": "error",
    "hokuriku/no-lint-suppression": "error",
    "hokuriku/no-organizer-fields": "error",
    "hokuriku/no-raw-markup": "error",
    "hokuriku/no-sql-outside-db": "error",

    // --- 型の境界：外部の値は unknown で受けて検証で型をつける ---
    "typescript/no-explicit-any": "error",
    "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    "typescript/no-non-null-assertion": "error",
    "typescript/ban-ts-comment": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",

    // --- 非同期：失敗を黙って捨てない（construction.md「silent failures are not acceptable」）---
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/await-thenable": "error",
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/restrict-template-expressions": "error",
    "typescript/only-throw-error": "error",

    // --- ログは src/log.ts の許可リスト経由だけ（レスポンス本文をログに出さない）---
    "no-console": "error",

    "import/no-cycle": "error",
    "typescript/consistent-type-imports": "error",
  },
  overrides: [
    {
      files: ["src/log.ts", "tools/**", "*.config.ts"],
      rules: { "no-console": "off" },
    },
  ],
});
