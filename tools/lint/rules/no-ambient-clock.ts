import { type Rule, matches, repoPath } from "../shared.ts";

const ENTRYPOINTS = ["src/worker.ts", "web/functions/"];

export const noAmbientClock: Rule = {
  meta: {
    type: "problem",
    messages: {
      forbidden:
        "現在時刻（{{what}}）はハンドラの境界（src/worker.ts, web/functions/）で1度だけ取得し、" +
        "以降は引数 `now` として渡す（project.md Mandated）。" +
        "ロジックの中で時計を読むと、開催日当日やちょうど14日前といった境界値をテストできなくなる。" +
        "テストでは固定の時刻を引数で渡すこと。",
    },
  },
  create(context) {
    const file = repoPath(context.filename);
    if (matches(file, ENTRYPOINTS)) return {};
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "Date") {
          context.report({ node, messageId: "forbidden", data: { what: "Date()" } });
          return;
        }
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "now" &&
          (callee.object.name === "Date" || callee.object.name === "performance")
        ) {
          context.report({ node, messageId: "forbidden", data: { what: `${callee.object.name}.now()` } });
        }
      },
      NewExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "Date" && node.arguments.length === 0) {
          context.report({ node, messageId: "forbidden", data: { what: "new Date()" } });
        }
      },
    };
  },
};
