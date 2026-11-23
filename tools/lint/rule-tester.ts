import path from "node:path";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { ROOT } from "./shared.ts";

RuleTester.describe = describe;
RuleTester.it = it;

export const tester = new RuleTester({ languageOptions: { sourceType: "module" } });

/** リポジトリ相対パスを、ルールが受け取る絶対パスにする。 */
export function at(file: string): string {
  return path.join(ROOT, file);
}
