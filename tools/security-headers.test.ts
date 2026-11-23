import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "../src/web/security-headers.ts";
import { ROOT } from "./lint/shared.ts";

// _headers（静的ファイル用）と、Functions の応答に付けるヘッダが同じ値であること。
describe("セキュリティヘッダの二重定義がずれていない", () => {
  it("web/public/_headers の /* の行と SECURITY_HEADERS が一致する", () => {
    const lines = readFileSync(path.join(ROOT, "web/public/_headers"), "utf8").split("\n");
    const fromFile = Object.fromEntries(
      lines
        .filter((l) => /^\s+\S+:/.test(l))
        .map((l) => {
          const i = l.indexOf(":");
          return [l.slice(0, i).trim().toLowerCase(), l.slice(i + 1).trim()];
        }),
    );
    expect(fromFile).toEqual(SECURITY_HEADERS);
  });
});
