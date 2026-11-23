import { type Rule, isTestFile, repoPath } from "../shared.ts";

const SQL_METHODS = new Set(["prepare", "batch"]);

export const noSqlOutsideDb: Rule = {
  meta: {
    type: "problem",
    messages: {
      forbidden:
        "D1 への SQL（.{{method}}()）は src/db/ の中だけに書く（project.md Mandated）。" +
        "必要なクエリは src/db/ に関数として足し、ここからはその関数を呼ぶ。" +
        "重複排除キーや列が変わったときに直す場所を1か所に保つため。",
    },
  },
  create(context) {
    const file = repoPath(context.filename);
    // テストは D1 の状態を直接確かめてよい（本番コードの制約ではない）。
    if (file.startsWith("src/db/") || isTestFile(file)) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          SQL_METHODS.has(callee.property.name)
        ) {
          context.report({ node, messageId: "forbidden", data: { method: callee.property.name } });
        }
      },
    };
  },
};
