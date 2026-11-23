import { type Rule, matches, repoPath } from "../shared.ts";

const ALLOWED = ["src/connpass/client.ts", "src/notify/discord.ts"];

export const noFetchOutsideClients: Rule = {
  meta: {
    type: "problem",
    messages: {
      forbidden:
        "外部への HTTP 呼び出し（fetch）は src/connpass/client.ts（connpass）と src/notify/discord.ts（Discord）" +
        "だけに置く（R-03, C-04）。connpass から新しい情報が要るなら client.ts に関数を足し、ここからはその関数を呼ぶ。" +
        "公開面から connpass への問い合わせを中継することは禁止されている（project.md Forbidden）。",
    },
  },
  create(context) {
    const file = repoPath(context.filename);
    if (matches(file, ALLOWED) || file.endsWith(".test.ts")) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        const isBareFetch = callee.type === "Identifier" && callee.name === "fetch";
        const isGlobalFetch =
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          (callee.object.name === "globalThis" || callee.object.name === "self") &&
          callee.property.type === "Identifier" &&
          callee.property.name === "fetch";
        if (isBareFetch || isGlobalFetch) context.report({ node, messageId: "forbidden" });
      },
    };
  },
};
