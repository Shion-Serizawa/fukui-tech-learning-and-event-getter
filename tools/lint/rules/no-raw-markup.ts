import { type Rule, isTestFile, repoPath } from "../shared.ts";

const MARKUP_DIRS = ["src/web/", "src/feed/", "web/functions/"];
const TAG_LIKE = /<[a-zA-Z!/?]/;

export const noRawMarkup: Rule = {
  meta: {
    type: "problem",
    messages: {
      forbidden:
        "HTML / XML を素の文字列やタグなしテンプレートで組み立てない（C-12）。" +
        "src/markup/ の html`...` / xml`...` タグを使えば、埋め込んだ値は自動でエスケープされる。" +
        "イベント名などの第三者由来の文字列が、公開ページと RSS における唯一の注入面である。",
    },
  },
  create(context) {
    const file = repoPath(context.filename);
    if (isTestFile(file) || !MARKUP_DIRS.some((d) => file.startsWith(d))) return {};
    return {
      Literal(node) {
        if (typeof node.value === "string" && TAG_LIKE.test(node.value)) {
          context.report({ node, messageId: "forbidden" });
        }
      },
      TemplateLiteral(node) {
        const parent = node.parent;
        if (parent?.type === "TaggedTemplateExpression") return;
        if (node.quasis.some((q) => TAG_LIKE.test(q.value.raw))) {
          context.report({ node, messageId: "forbidden" });
        }
      },
    };
  },
};
