import path from "node:path";
import { type ReportNode, type Rule, ROOT, isTestFile, repoPath } from "../shared.ts";

/**
 * 層と、その層が依存してよい層。表の正は docs/spec/05-architecture.md「モジュールと依存方向」。
 * ここを変えるときは仕様書も同じ PR で変える。
 */
const LAYERS = [
  ["src/domain/", "domain"],
  ["src/markup/", "markup"],
  ["src/log.ts", "log"],
  ["src/connpass/", "connpass"],
  ["src/db/", "db"],
  ["src/notify/", "notify"],
  ["src/collector/", "collector"],
  ["src/feed/", "feed"],
  ["src/web/", "web"],
  ["src/worker.ts", "worker-entry"],
  ["web/functions/", "pages-entry"],
  ["test/", "test"],
] as const;

type Layer = (typeof LAYERS)[number][1];

const ALLOWED: Record<Layer, readonly Layer[]> = {
  domain: [],
  markup: [],
  log: [],
  connpass: ["domain", "log"],
  db: ["domain", "log"],
  notify: ["domain", "log"],
  collector: ["domain", "connpass", "db", "notify", "log"],
  feed: ["domain", "markup"],
  web: ["domain", "markup"],
  "worker-entry": ["domain", "log", "connpass", "db", "notify", "collector"],
  "pages-entry": ["domain", "markup", "log", "db", "web", "feed"],
  test: [
    "domain",
    "markup",
    "log",
    "connpass",
    "db",
    "notify",
    "collector",
    "feed",
    "web",
    "worker-entry",
    "pages-entry",
  ],
};

/** 実行時の外部依存を持たない純粋な層。パッケージや cloudflare:* を import しない。 */
const PURE: readonly Layer[] = ["domain", "markup", "web", "feed", "log"];

const WHY: Partial<Record<Layer, string>> = {
  connpass:
    "connpass の DTO と HTTP 呼び出しは src/connpass/ の外へ出さない（R-03）。公開面から connpass を中継しない（C-06）。",
  db: "SQL を書く場所は src/db/ に限る。描画・RSS 生成は取得済みのデータを引数で受け取る純粋関数にする。",
  collector: "収集の手順は Worker の Cron からだけ動く。公開ページや RSS から収集を起動しない。",
  notify: "Discord への通知は Worker の収集回からだけ送る。公開面から通知を送る経路を作らない。",
};

/** 外の層から import してよい入口。ここに無い層は、層の中のどのファイルを import してもよい。 */
const PUBLIC_ENTRY: Partial<Record<Layer, readonly string[]>> = {
  connpass: ["src/connpass/index.ts"],
};

/** 特定の層からだけ、入口をさらに絞る。公開面（Pages）は D1 への書き込み関数を import できない。 */
const RESTRICTED_ENTRY: Partial<Record<Layer, Partial<Record<Layer, readonly string[]>>>> = {
  "pages-entry": { db: ["src/db/read.ts", "src/db/rows.ts"] },
};

function layerOf(file: string): Layer | undefined {
  for (const [prefix, layer] of LAYERS) {
    if (prefix.endsWith("/") ? file.startsWith(prefix) : file === prefix) return layer;
  }
  return undefined;
}

export const importBoundaries: Rule = {
  meta: {
    type: "problem",
    messages: {
      layer:
        "{{from}} 層から {{to}} 層を import できない。{{from}} が依存してよいのは [{{allowed}}] だけ。{{why}}" +
        "（依存方向の表: docs/spec/05-architecture.md）",
      pure:
        "{{from}} 層は外部依存を持たない純粋な層なので、パッケージ（{{spec}}）を import できない。" +
        "入出力が必要なら呼び出し側（エントリポイント）で行い、結果を引数で渡す。",
      testHelper: "テスト用のコード（test/）は *.test.ts からだけ import する。",
      entry:
        "{{to}} 層の外からは {{entry}} だけを import する。" +
        "connpass のレスポンス形状を写した型（DTO）や内部の関数をモジュールの外へ出さないため（R-03）。" +
        "外で必要なものは index.ts から、このプロジェクトの型（src/domain/）に変換した形で公開する。",
    },
  },
  create(context) {
    const file = repoPath(context.filename);
    const from = layerOf(file);
    if (from === undefined) return {};
    const fileIsTest = isTestFile(file);

    const check = (node: ReportNode, spec: string) => {
      if (!spec.startsWith(".")) {
        if (!fileIsTest && PURE.includes(from)) {
          context.report({ node, messageId: "pure", data: { from, spec } });
        }
        return;
      }
      const target = repoPath(path.resolve(ROOT, path.dirname(file), spec));
      const to = layerOf(target);
      if (to === undefined || to === from) return;
      if (to === "test") {
        if (!fileIsTest) context.report({ node, messageId: "testHelper" });
        return;
      }
      if (fileIsTest) return;
      if (!ALLOWED[from].includes(to)) {
        context.report({
          node,
          messageId: "layer",
          data: { from, to, allowed: ALLOWED[from].join(", "), why: WHY[to] ?? "" },
        });
        return;
      }
      const entries = RESTRICTED_ENTRY[from]?.[to] ?? PUBLIC_ENTRY[to];
      if (entries !== undefined && !entries.includes(target)) {
        context.report({ node, messageId: "entry", data: { to, entry: entries.join(", ") } });
      }
    };

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === "Literal" && typeof node.source.value === "string") {
          check(node, node.source.value);
        }
      },
    };
  },
};
