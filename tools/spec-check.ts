import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lint/shared.ts";

/**
 * 仕様（docs/spec/03-behavior.md）の要件と、自動テストの対応を検査する。
 * - 検証手段に test を含む要件 ID が、どのテストの名前にも現れない → 未対応として列挙する
 * - テストが、仕様に存在しない要件 ID を名乗っている → 常にエラー（仕様とテストのずれ）
 * `--strict` を付けると、未対応の要件があるだけでエラーにする（実装が揃ったら CI で有効にする）。
 */

const ID = /\b(?:COL|STO|WEB|RSS|HLT)-\d{2}\b/g;

export interface Requirement {
  readonly id: string;
  readonly needsTest: boolean;
}

export function parseRequirements(markdown: string): Requirement[] {
  const out: Requirement[] = [];
  for (const line of markdown.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    const id = cells[1] ?? "";
    if (!/^(?:COL|STO|WEB|RSS|HLT)-\d{2}$/.test(id)) continue;
    const verification = cells[4] ?? "";
    out.push({ id, needsTest: /\btest\b/.test(verification) });
  }
  return out;
}

/** describe / it / test の名前（第1引数の文字列）に現れる要件 ID だけを拾う。コメントや本文の文字列は数えない。 */
const TEST_NAME = /\b(?:describe|it|test)(?:\.\w+(?:\([^)]*\))?)*\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;

export function referencedIds(source: string): Set<string> {
  const ids = new Set<string>();
  for (const m of source.matchAll(TEST_NAME)) for (const id of (m[2] ?? "").match(ID) ?? []) ids.add(id);
  return ids;
}

function testFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  return readdirSync(abs, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".test.ts"))
    .map((f) => path.join(abs, f));
}

function main(): number {
  const strict = process.argv.includes("--strict");
  const requirements = parseRequirements(readFileSync(path.join(ROOT, "docs/spec/03-behavior.md"), "utf8"));
  const known = new Set(requirements.map((r) => r.id));

  const covered = new Set<string>();
  const dangling: string[] = [];
  for (const file of [...testFiles("src"), ...testFiles("test")]) {
    for (const id of referencedIds(readFileSync(file, "utf8"))) {
      if (known.has(id)) covered.add(id);
      else dangling.push(`${path.relative(ROOT, file)}: ${id}`);
    }
  }

  const needed = requirements.filter((r) => r.needsTest);
  const missing = needed.filter((r) => !covered.has(r.id)).map((r) => r.id);

  console.log(`要件 ${requirements.length} 件のうち test で検証するもの ${needed.length} 件`);
  console.log(`テストあり ${needed.length - missing.length} 件 / 未対応 ${missing.length} 件`);
  if (missing.length > 0) console.log(`未対応: ${missing.join(", ")}`);

  if (dangling.length > 0) {
    console.error("仕様に存在しない要件 ID をテストが参照している（仕様かテストを直す）:");
    for (const d of dangling) console.error(`  ${d}`);
    return 1;
  }
  if (strict && missing.length > 0) {
    console.error("--strict: 未対応の要件がある");
    return 1;
  }
  return 0;
}

if (import.meta.main) process.exitCode = main();
