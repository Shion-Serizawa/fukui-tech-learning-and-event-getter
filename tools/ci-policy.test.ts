import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./lint/shared.ts";

// 公開リポジトリ × CI デプロイの帰結として必須の設定（team.md「Deployment」, project.md Forbidden）を
// ワークフローの定義に対して機械的に検査する。
const dir = path.join(ROOT, ".github/workflows");
const workflows = readdirSync(dir)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .map((f) => ({ name: f, text: readFileSync(path.join(dir, f), "utf8") }));

describe("GitHub Actions のワークフロー", () => {
  it("1つ以上ある", () => {
    expect(workflows.length).toBeGreaterThan(0);
  });

  for (const { name, text } of workflows) {
    const code = text
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("#"))
      .join("\n");

    it(`${name}: pull_request_target を使わない`, () => {
      expect(code).not.toMatch(/pull_request_target/);
    });

    it(`${name}: Action はコミット SHA で固定する`, () => {
      const uses = [...code.matchAll(/uses:\s*([^\s#]+)/g)].map((m) => m[1] ?? "");
      const unpinned = uses.filter((u) => !u.startsWith("./") && !/@[0-9a-f]{40}$/.test(u));
      expect(unpinned).toEqual([]);
    });

    it(`${name}: 先頭で permissions を contents: read に絞る`, () => {
      expect(code).toMatch(/^permissions:\n\s+contents: read\s*$/m);
    });

    it(`${name}: pull_request で起動するならシークレットを参照しない（GITHUB_TOKEN を除く）`, () => {
      if (!/^\s*pull_request:/m.test(code)) return;
      const secrets = [...code.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]);
      expect(secrets.filter((s) => s !== "GITHUB_TOKEN")).toEqual([]);
    });
  }
});
