import { type ReportNode, type Rule, repoPath } from "../shared.ts";

const PATTERN = /owner_?(nickname|display_?name)/i;
const ALLOWED_PREFIXES = ["src/connpass/fixtures/", "tools/lint/"];

export const noOrganizerFields: Rule = {
  meta: {
    type: "problem",
    messages: {
      forbidden:
        "主催者名（{{name}}）は D1 の列・内部の型・ログ・画面のどこにも持たせない（C-14, D-12）。" +
        "connpass のレスポンスからは使うフィールドだけを明示列挙して取り出す（allowlist）。" +
        "フィクスチャで「捨てられること」を確かめる場合だけ src/connpass/fixtures/ に書いてよい。",
    },
  },
  create(context) {
    const file = repoPath(context.filename);
    if (ALLOWED_PREFIXES.some((p) => file.startsWith(p))) return {};
    const check = (node: ReportNode, text: string) => {
      const m = PATTERN.exec(text);
      if (m) context.report({ node, messageId: "forbidden", data: { name: m[0] } });
    };
    return {
      Identifier(node) {
        check(node, node.name);
      },
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};
