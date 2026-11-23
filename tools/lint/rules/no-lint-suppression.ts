import type { Rule } from "../shared.ts";

const DIRECTIVE = /\b(oxlint|eslint)-(disable|enable)/;
const TS_DIRECTIVE = /@ts-(ignore|expect-error|nocheck)/;

export const noLintSuppression: Rule = {
  meta: {
    type: "problem",
    messages: {
      lint:
        "lint の抑制コメントは使わない。ルールに引っかかったら、コードの側で根本原因を直す。" +
        "ルール自体が間違っていると判断したなら、oxlint.config.ts と docs/spec/05-architecture.md を" +
        "変更する PR として出す（例外をコードに散らさない）。",
      ts: "型検査の抑制コメント（@ts-ignore 等）は使わない。外部から来た値は unknown で受けて検証で型をつける。",
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (DIRECTIVE.test(comment.value)) context.report({ loc: comment.loc, messageId: "lint" });
          else if (TS_DIRECTIVE.test(comment.value)) context.report({ loc: comment.loc, messageId: "ts" });
        }
      },
    };
  },
};
