# 05. 構成と規則

## 考え方

エージェント（と自分）が書くコードを信頼できるようにするため、規則はできるだけ**決定的な検査**で守る。投資の順番は次のとおり。

1. **コードそのもの** — 正しいことがデフォルトになる API とディレクトリ構造（例: `html` タグを使えば自動でエスケープされる）
2. **静的検査とテスト** — 型、lint（プロジェクト固有のルールを含む）、テスト
3. **検証** — 実際の Workers ランタイム上でのテスト、ローカル実行、キー発行後の実データ確認
4. **文章** — この仕様書と `CLAUDE.md`。判断が要るものだけ

**エージェントの誤りを直したら、まず 1〜3 に落とせないかを考える。** 文章に1行足すのは最後の手段。コメントで「ここではこうしない」と書くより、そう書けない構造にする。lint の抑制コメントは使わない（`hokuriku/no-lint-suppression`）。ルールが間違っていると判断したら、ルールと仕様書を変える。

## 全体の構成

```
          Cron（毎時17分）
                 │
                 ▼
   ┌──────── Worker（src/worker.ts）── HTTP では何も公開しない ────────┐
   │  collector ──► connpass ──► https://connpass.com/api/v2           │
   │      │    └──► notify ───► Discord Webhook（停止・復旧の通知）     │
   │      ▼                                                             │
   │     db                                                             │
   └──────┼─────────────────────────────────────────────────────────────┘
          ▼
       ┌──────┐
       │  D1  │
       └──────┘
          ▲
   ┌──────┼────────── Pages（web/functions/）──────────────────────────┐
   │     db ──► web（一覧の組み立て）  ◄── GET /                        │
   │     db ──► feed（RSS の組み立て） ◄── GET /feed.xml                │
   └────────────────────────────────────────────────────────────────────┘
```

<!-- 文章版: Worker は Cron でだけ動き、collector が connpass から取得して db 経由で D1 に書く。停止・復旧を判定したら notify が Discord に送る。Worker は HTTP では何も公開しない。Pages は公開一覧（GET /）と RSS（GET /feed.xml）を受け、db から読んで web / feed で組み立てる。Pages は connpass にも Discord にも触れない。 -->

Worker と Pages を分ける（Q8=B）。収集と通知は Worker、公開ページと RSS は Pages。両者は同じ D1 を使う。

## モジュールと依存方向

ディレクトリが層を表す。層をまたぐ import は次の表に従う。**表の正は `tools/lint/rules/import-boundaries.ts`** で、違反すると lint が止める。

| 層            | 場所             | 役割                                                                                         | 依存してよい層                               | 外部依存       |
| ------------- | ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------- |
| domain        | `src/domain/`    | 共有する型と、判定ロジック（表示期間、並び順、停止判定、日時の書式）                         | なし                                         | なし（純粋）   |
| markup        | `src/markup/`    | エスケープ付きの `html` / `xml` タグ                                                         | なし                                         | なし（純粋）   |
| log           | `src/log.ts`     | 許可リスト方式のログ出力                                                                     | なし                                         | なし           |
| connpass      | `src/connpass/`  | connpass API の呼び出し・DTO・実行時検証・変換。**外からは `index.ts` だけを import できる** | domain, log                                  | —              |
| db            | `src/db/`        | D1 への SQL のすべて                                                                         | domain, log                                  | `cloudflare:*` |
| notify        | `src/notify/`    | Discord Webhook への送信。外への HTTP 呼び出しは connpass 以外ではここだけ                   | domain, log                                  | —              |
| collector     | `src/collector/` | 収集回の手順（取得 → 検証 → 全か無かの書き込み → 記録 → 停止判定と通知）                     | domain, connpass, db, notify, log            | —              |
| feed          | `src/feed/`      | RSS の組み立て（データを引数で受け取る純粋関数）                                             | domain, markup                               | なし（純粋）   |
| web           | `src/web/`       | 公開一覧の組み立て（データを引数で受け取る純粋関数）                                         | domain, markup                               | なし（純粋）   |
| Worker の入口 | `src/worker.ts`  | `scheduled`（と、常に 404 を返す `fetch`）。now と env を読み、各層を呼ぶ                    | domain, log, connpass, db, notify, collector | `cloudflare:*` |
| Pages の入口  | `web/functions/` | `GET /`（一覧）と `GET /feed.xml`（RSS）。now と env を読み、db と web / feed を呼ぶ         | domain, markup, log, db, web, feed           | `cloudflare:*` |
| テスト補助    | `test/`          | テストからだけ使う                                                                           | すべて                                       | すべて         |

ポイント:

- **Pages の入口は connpass にも collector にも notify にも依存できない。** 公開面から connpass への問い合わせを中継する経路が、構造として存在しない（C-06）
- **Worker は HTTP で何も公開しない。** 公開面はすべて Pages にある
- **web と feed は純粋関数。** D1 を読むのは入口の仕事で、web / feed は読んだ結果を受け取って文字列を返すだけ。だからブラウザも D1 もなしにテストできる
- **connpass の DTO は `src/connpass/` から出ない。** 外へ出るのは `src/domain/` の `HokurikuEvent` だけ（R-03）。API の仕様が変わっても直す場所は `src/connpass/` に閉じる
- テストファイル（`*.test.ts`）は、自分の層のファイルに加えて任意の層を import できる

## 入口の決まりごと

- 現在時刻（`now`）は入口で1度だけ取得する（`scheduled` は `controller.scheduledTime`、`fetch` / Pages は `Date.now()`）。以降は引数で渡す
- `env` は入口のハンドラ引数で受け取り、必要な値だけを引数で渡す。モジュールのトップレベルでシークレットを読まない
- 外への HTTP 呼び出しは `src/connpass/client.ts`（connpass）と `src/notify/discord.ts`（Discord）の中だけ。`fetch` 関数は入口から引数で注入する（テストでは偽物を渡す）
- 待機（COL-05 の 1100ms）も引数で注入する。テストは実時間を待たない

## 規則と強制手段

AI-DLC で確定した規則（`aidlc/spaces/default/memory/project.md` の Mandated / Forbidden）と、それぞれをどの仕組みで守っているか。**「文章のみ」の行は、決定的な検査に落とす候補**。

### connpass との境界

| 規則                                                                              | 強制手段                                                                                                                                |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 取得は公式 API v2 のみ。スクレイピングしない（C-01）                              | lint `no-fetch-outside-clients`（HTTP 呼び出しを2ファイルに閉じ込める）+ test COL-06（送り先の URL を固定）                             |
| HTTP 呼び出し・ヘッダ・レート制御・429 の扱いを単一モジュールに閉じ込める（R-03） | lint `no-fetch-outside-clients` + lint `import-boundaries`                                                                              |
| DTO をモジュールの外へ出さない（R-03）                                            | lint `import-boundaries`（外からは `src/connpass/index.ts` のみ）                                                                       |
| 変換点を1つにする（R-03）                                                         | 文章のみ（`src/connpass/parse.ts` に置く）。候補: DTO 型を `parse.ts` 以外から import できないようにする                                |
| 変換点で実行時に検証し、欠けていたら失敗として記録する                            | test COL-11                                                                                                                             |
| 変換は使うフィールドの明示列挙（allowlist）                                       | test COL-11 / WEB-17 + lint `no-organizer-fields`                                                                                       |
| レート制限を守り、429 を扱う（C-04）                                              | test COL-05 / COL-07                                                                                                                    |
| 自動テストから connpass API を呼ばない                                            | **config**: `vitest.config.ts` の `outboundService` がテスト中の外部通信をすべて遮断する + test `test/no-network.test.ts`               |
| 実レスポンスをフィクスチャとしてコミットしない                                    | 文章のみ。部分的に lint `no-organizer-fields`（主催者名を書けるのは `fixtures/` だけ）                                                  |
| レスポンス本文をログに出さない                                                    | lint `no-console`（`src/log.ts` 以外）+ `src/log.ts` の許可リスト（test COL-10）                                                        |
| 公開面に connpass の中継エンドポイントを作らない（C-06）                          | lint `import-boundaries`（Pages は connpass に依存できない）+ config `workers_dev: false` + test RSS-02（Worker の `fetch` は常に 404） |

### 保存・表示

| 規則                                                     | 強制手段                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| D1 への SQL は `src/db/` だけ                            | lint `no-sql-outside-db`                                                                    |
| 主催者名をどこにも持たない（C-14）                       | lint `no-organizer-fields` + test STO-07（スキーマ）+ test WEB-17（出力）                   |
| 共有する型は1か所（`src/domain/`）                       | lint `import-boundaries`（Pages の入口は domain に依存できる。他に型の置き場所がない）      |
| 現在時刻は境界で1度だけ取得                              | lint `no-ambient-clock`                                                                     |
| `env` は引数で渡す。トップレベルでシークレットを読まない | lint `no-global-env`                                                                        |
| 第三者由来の文字列はエスケープして出力（C-12）           | **API**: `src/markup/` の `html` / `xml` タグ + lint `no-raw-markup` + test WEB-16 / RSS-07 |
| D1 の読み取り失敗を「0件」と同じ見え方にしない           | test WEB-11                                                                                 |
| 最後に成功した収集の日時を記録する                       | test COL-09 / WEB-10                                                                        |
| ~~RSS を認証なしで配信しない（C-13）~~                   | 2026-11-23 に廃止。RSS は公開（01-product.md C-13, R-07）                                   |
| 停止の通知に主催者名・イベント情報を含めない             | test HLT-06                                                                                 |

### 型・コード品質

| 規則                                          | 強制手段                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 外部の値は `unknown` で受けて検証で型をつける | tsconfig `strict` ほか + lint `no-explicit-any` / `consistent-type-assertions: never` / `no-unsafe-*`  |
| 失敗を黙って捨てない                          | lint `no-floating-promises` / `no-misused-promises` / `switch-exhaustiveness-check`                    |
| 抑制コメントで例外を作らない                  | lint `no-lint-suppression` / `ban-ts-comment`                                                          |
| 整形は機械に任せる                            | oxfmt（`fmt:check` が CI で止める）。埋め込み言語（`html` タグの中身）は整形しない（出力が変わるため） |

### リポジトリと CI

| 規則                                                                      | 強制手段                                                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `main` への変更は PR 経由で、CI が通ることをマージ条件にする              | **手作業**: GitHub のブランチ保護（06-operations.md）                                                              |
| `pull_request_target` を使わない。PR 起動のジョブにシークレットを渡さない | test `tools/ci-policy.test.ts`                                                                                     |
| 第三者製の Action はコミット SHA で固定                                   | test `tools/ci-policy.test.ts`                                                                                     |
| ワークフローの権限は `contents: read`                                     | test `tools/ci-policy.test.ts`                                                                                     |
| シークレットの値をリポジトリに書かない（C-03）                            | CI `gitleaks` + `.gitignore`（`.dev.vars`、`.wrangler/`）+ **手作業**: GitHub のシークレットスキャンとプッシュ保護 |
| 公開から7日未満の依存を入れない                                           | **config**: `.npmrc` の `min-release-age=7`（ローカル）+ `.github/dependabot.yml` の `cooldown`（更新 PR）         |
| ロックファイルをコミットし CI は `npm ci`                                 | config（`.github/workflows/ci.yml`）                                                                               |
| Cloudflare のトークンはスコープ付き。Global API Key を使わない            | **手作業**（06-operations.md）                                                                                     |
| 無料枠に収める（C-09）                                                    | 文章のみ（06-operations.md の見積もり）                                                                            |

## テストの構成

| 種類           | 場所                                                        | 実行環境                               | 内容                                                                                                                     |
| -------------- | ----------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 単体           | `src/**/*.test.ts`（同じ場所に置く）                        | workerd（`@cloudflare/vitest-plugin`） | domain の判定、connpass の検証と変換、markup、log                                                                        |
| 結合（Worker） | `test/*.test.ts`                                            | workerd + ローカル D1                  | Cron ハンドラを直接起動 → 偽の fetch がフィクスチャを返す → D1 に期待した行が入る。停止通知。Worker が何も公開しないこと |
| 結合（描画）   | `src/web/*.test.ts`、`src/feed/*.test.ts`、`test/*.test.ts` | workerd + ローカル D1                  | D1 に既知のデータを入れ、一覧と RSS が期待した並び・状態で出る。ブラウザは起動しない                                     |
| lint ルール    | `tools/lint/rules/*.test.ts`                                | Node                                   | 各ルールが止めるべきコードを止め、通すべきコードを通す                                                                   |
| CI ポリシー    | `tools/ci-policy.test.ts`                                   | Node                                   | ワークフロー定義の検査                                                                                                   |

カバレッジ: 行 80%、対象は `src/` から `src/web/` を除いたもの（収集・保存・RSS・通知）。この下限は緩めない（team.md「Testing Posture」）。

テストは test-after（実装してそのレイヤーが動いたら、同じ変更の中でテストを書く）。判定ロジックには必ずテストを伴わせる。
