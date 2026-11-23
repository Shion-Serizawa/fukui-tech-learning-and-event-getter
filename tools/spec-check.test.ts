import { describe, expect, it } from "vitest";
import { parseRequirements, referencedIds } from "./spec-check.ts";

describe("spec-check", () => {
  it("要件表の行から ID と、test で検証するかを読む", () => {
    const md = [
      "| ID | 要件 | 合否の判定 | 検証 | 出典 |",
      "|---|---|---|---|---|",
      "| COL-01 | 毎時 | crons | config | D-38 |",
      "| COL-02 | 県ごと | 順序 | test | C-10 |",
      "| COL-10 | ログ | 許可リスト | lint, test | C-14 |",
      "| M-02 | 割合 | — | 実測 | D-41 |",
    ].join("\n");
    expect(parseRequirements(md)).toEqual([
      { id: "COL-01", needsTest: false },
      { id: "COL-02", needsTest: true },
      { id: "COL-10", needsTest: true },
    ]);
  });

  it("テストのソースから要件 ID を拾う", () => {
    expect(referencedIds(`describe("WEB-08: 空状態", () => { it("RSS-01 と STO-05", ...) })`)).toEqual(
      new Set(["WEB-08", "RSS-01", "STO-05"]),
    );
  });
});
