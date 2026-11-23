import { describe, expect, it } from "vitest";
import { pickLogFields } from "./log.ts";

describe("log: 出してよい項目だけを出す（C-14, C-05）", () => {
  it("許可リストにない項目は実行時にも落とす", () => {
    const fromSomewhere = { status: 200, count: 3, body: "{...}", title: "x" };
    expect(pickLogFields(fromSomewhere)).toEqual({ status: 200, count: 3 });
  });
});
