import path from "node:path";
import type { RuleTester } from "oxlint/plugins-dev";

export type Rule = Parameters<RuleTester["run"]>[1];
export type RuleContext = Parameters<NonNullable<Rule["create"]>>[0];
export type ReportNode = NonNullable<Parameters<RuleContext["report"]>[0]["node"]>;

export const ROOT = path.resolve(import.meta.dirname, "../..");

export function repoPath(filename: string): string {
  return path.relative(ROOT, filename).split(path.sep).join("/");
}

export function isTestFile(file: string): boolean {
  return file.endsWith(".test.ts") || file.startsWith("test/");
}

export function matches(file: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => (p.endsWith("/") ? file.startsWith(p) : file === p));
}

export const SPEC_ARCH = "docs/spec/05-architecture.md";
