import { type Rule, isTestFile, repoPath } from "../shared.ts";

export const noGlobalEnv: Rule = {
  meta: {
    type: "problem",
    messages: {
      forbidden:
        "`env`（バインディングとシークレット）は cloudflare:workers から import せず、" +
        "エントリポイントのハンドラ引数で受け取って必要な値だけを引数で渡す（project.md Mandated, C-03）。" +
        "引数で渡せば、テストではフィクスチャの値を渡すだけで済む。",
    },
  },
  create(context) {
    if (isTestFile(repoPath(context.filename))) return {};
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "cloudflare:workers") return;
        for (const s of node.specifiers) {
          if (s.type === "ImportSpecifier" && s.imported.type === "Identifier" && s.imported.name === "env") {
            context.report({ node: s, messageId: "forbidden" });
          }
        }
      },
    };
  },
};
