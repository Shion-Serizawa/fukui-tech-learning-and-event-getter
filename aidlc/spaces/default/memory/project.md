# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

- AI-DLC のステージが1つ承認されるごとに、そのステージの成果物を Conventional Commits 形式で1コミットにまとめてコミットする (learned 2026-09-20) <!-- cid:260919-fukui-event-collector:intent-capture:014053421d20d4e36e891c19386f071ddcc2bd2c34ca58c3724b7ec871448a3f -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Change Control

<!-- Project-specific. Mode: strict or relaxed. Strict here holds for every intent and cannot be changed from chat. -->

## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

- NEVER connpass に対してスクレイピング・クローリングその他 API 以外の方法でアクセスする。自動・手動を問わない（C-01、D-08。connpass 利用規約 第7条第1項第17号で禁止されている） (affirmed 2026-09-20)

- NEVER 取得した情報を、API 利用申請で申告した目的以外に用いる（C-05、C-07、D-10） (affirmed 2026-09-20)

- NEVER connpass への問い合わせを中継する汎用エンドポイントを公開面に作る。Worker の公開面は「公開ページ」と「認証付き RSS」の2つに保つ（C-04、C-06。作ると自分の API キーのレート枠を他人に使われ、競合サービスの提供の議論にも近づく） (affirmed 2026-09-20)

- NEVER 自動テストから connpass API を呼ぶ。キー発行後も行わない（C-01、C-04） (affirmed 2026-09-20)

- NEVER connpass API の実レスポンスをそのままフィクスチャとしてコミットする。デバッグ目的で保存した生レスポンスもリポジトリ内に置かない（Q6=A、C-14。**公開リポジトリ**（Q1=A）に一度コミットすれば、扱わないと決めた個人データが Git 履歴に恒久的に残り、消すには履歴の書き換えが要る） (affirmed 2026-09-20)

- NEVER connpass API のレスポンス本文をそのままログに出力する。ログに出してよいのは HTTP ステータス、イベント ID、件数、所要時間まで（C-14、C-05。「保存」と「表示」だけを禁じるとログ出力という第3の経路が空き、Cloudflare のログに主催者名が書き出される） (affirmed 2026-09-20)

- NEVER 主催者名（`owner_nickname` / `owner_display_name`）を、D1 の列・内部の型・ログ・画面のいずれにも持たせる（C-14、D-12。文章の禁止は破られたことに気づけないため、構造として存在させないところまで落とす） (affirmed 2026-09-20)

- NEVER シークレット（connpass API キー、個人用 RSS の認証情報、Cloudflare API トークン）を、ソースコード・設定ファイル・コミット履歴・テストのフィクスチャ・CI のログ・公開ページの HTML に書き込む（C-03、C-13。禁じているのは**値**であり、バインディング名やシークレット名を設定ファイルに書くことは含まない） (affirmed 2026-09-20)

- NEVER Cloudflare の Global API Key を使う（最小権限。アカウント全体に及び、失効も面倒である） (affirmed 2026-09-20)

- NEVER `pull_request_target` トリガのワークフローでシークレットを扱う。フォークからの PR で起動するジョブにシークレットを渡さない（Q1=A × Q7=B。公開リポジトリにはフォークから PR が来るため、デプロイジョブは `on: push` の `main` のみで動かす） (affirmed 2026-09-20)

- NEVER 第三者製の GitHub Action をタグやブランチ参照で使う。コミット SHA でピン留めする（そのワークフローは Cloudflare API トークンを読める位置にある） (affirmed 2026-09-20)

- NEVER 個人用 RSS を認証なしで配信する。また公開ページから RSS への導線を置かない（C-13、D-17、D-32） (affirmed 2026-09-20)

- NEVER 公開から7日未満のバージョンの実行時依存を採用する（Q11=B） (affirmed 2026-09-20)

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

- ALWAYS connpass からのデータ取得は公式 API v2 を通して行い、`X-API-Key` ヘッダで認証する（C-01、C-03、D-08） (affirmed 2026-09-20)

- ALWAYS connpass への HTTP 呼び出し（`fetch`、`X-API-Key` ヘッダ、レート制御、429 の扱い）を単一のモジュールに閉じ込める（R-03） (affirmed 2026-09-20)

- ALWAYS connpass のレスポンス形状をそのまま写した型（DTO）は、そのモジュールの外へ出さない。外へ出るのはこのプロジェクトが自分で定義したイベントの型だけとする（R-03） (affirmed 2026-09-20)

- ALWAYS DTO からプロジェクト側の型への変換関数を1つ置き、そこを唯一の変換点とする（R-03） (affirmed 2026-09-20)

- ALWAYS その変換点でレスポンスを実行時に検証する。想定した必須フィールドが欠けていたら保存せず、その収集回を失敗として記録する（R-03、S-05。TypeScript の型注釈はコンパイル時に消えるため、検証がなければ仕様変更は「失敗」ではなく「`undefined` の静かな保存」として現れ、S-05 が検知できない） (affirmed 2026-09-20)

- ALWAYS 変換は使用するフィールドを明示列挙する形（allowlist）で書く。レスポンス全体をスプレッドしたり、そのまま保存したりしない（C-14、C-05） (affirmed 2026-09-20)

- ALWAYS connpass API の呼び出しではレート制限（APIキーあたり1秒1リクエスト）を守り、HTTP 429 を受け取った場合の扱いを実装する（C-04） (affirmed 2026-09-20)

**R-03 の対応方針を3点に分けたのは意図的である。** 呼び出しだけを閉じ込めても、API が返した JSON の形がそのままモジュールの外へ出ていけば、仕様変更の影響範囲は結局コードベース全体に広がる。実際に守るのは型の境界であって fetch の位置ではない。 (affirmed 2026-09-20)

- ALWAYS D1 への SQL を書く場所を保存モジュールに限定する。Cron ハンドラ・公開ページのレンダリング・RSS 生成のいずれにも `env.DB.prepare(...)` を直接書かない（B-02 の重複排除キーが変わったときに直す場所を1か所にするため） (affirmed 2026-09-20)

- ALWAYS `env`（バインディング）は引数として明示的に渡す。モジュールのトップレベルでシークレットを読まない（C-03 の実装上の帰結であり、フィクスチャによるテストが書ける前提でもある） (affirmed 2026-09-20)

- ALWAYS フロントエンド（Pages）とバックエンド（Worker）で同一となる型は、単一の共有された場所に置き、双方がそこに依存する（Q13） (affirmed 2026-09-20)

- ALWAYS 現在時刻はハンドラの境界で1度だけ取得し、以降のロジックへは引数として渡す。ロジックの内部で現在時刻を直接読まない（テスト可能性の要件。開催日の判定 / D-40、直近1〜2週間の抽出 / D-19、収集停止の判定 / S-05 がいずれも現在時刻に依存する） (affirmed 2026-09-20)

- ALWAYS 第三者由来の文字列（イベント名・説明・開催場所）を HTML / XML に出力するときは、エスケープを通す。素の文字列連結で埋め込まない（C-12。公開ページと RSS における唯一の注入面） (affirmed 2026-09-20)

- ALWAYS D1 の読み取りに失敗したときは、その旨を利用者に示す。「イベントが0件」と同じ見え方にしない（D-26、D-30） (affirmed 2026-09-20)

- ALWAYS テスト用フィクスチャは手で書く（Q6=A） (affirmed 2026-09-20)

- ALWAYS 認証なしで個人用 RSS のエンドポイントを叩いたときに 200 が返らないことを、恒久的な回帰テストとして持つ（C-13） (affirmed 2026-09-20)

- ALWAYS 主催者名が D1 のスキーマにも内部の型にも公開ページの出力にも現れないことを、スキーマテストとして持つ（C-14） (affirmed 2026-09-20)

- ALWAYS 「最後に成功した収集の日時」を D1 に記録する（S-05 の前提であり、フッターの最終収集日時 / D-25 の出どころでもある） (affirmed 2026-09-20)

- ALWAYS 実行時の依存を追加するときは、公開から7日以上経過したバージョンのみを採用する。**この待機は Renovate の `minimumReleaseAge` または Dependabot の `cooldown` として道具の設定で強制し、人の心がけに委ねない**（Q11=B） (affirmed 2026-09-20)

- ALWAYS Cloudflare へのデプロイにはスコープ付き API トークン（Workers Scripts:Edit / D1:Edit / Pages:Edit を対象アカウントに限定）を使う（Q7=B） (affirmed 2026-09-20)

- ALWAYS `main` への変更は PR を経由し、CI が通ることをマージの条件とする（Q2=A） (affirmed 2026-09-20)

- ALWAYS シークレット（connpass API キー、個人用 RSS の認証情報、Cloudflare API トークン）は、Workers のシークレットまたは GitHub Actions のシークレットとして登録し、実行時に環境から読み込む（C-03、Q7=B、`org.md` 構成フェーズのガードレール「Never hardcode credentials, API keys, or secrets」） (affirmed 2026-09-20)

- ALWAYS 実行基盤の構成変更を入れるときは、Cloudflare 無料枠の範囲に収まることを確認する（C-09、D-14） (affirmed 2026-09-20)

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- 外部サービスに依存する機能を扱うステージでは、利用者に質問する前に、そのサービスの利用規約と API 仕様を自分で調査する。調査でわかった事実は質問の前提として提示し、利用者には判断が必要な点だけを聞く (learned 2026-09-20) <!-- cid:260919-fukui-event-collector:feasibility:b08f418f4ecb36ec725b582c7e90d3b68ad0fc74ffbad81b1f0fb7e5891d7b16 -->
- ステージの標準的な確認事項が、このプロジェクトでは確認する相手も対象も存在しない場合は、黙って省かずに、省いた項目と理由を質問ファイルの冒頭に表として示す (learned 2026-09-20) <!-- cid:260919-fukui-event-collector:approval-handoff:6f73967d6ff5afbeaf756d6f729f85585d561ec7d3d2646d06d99b9bb163e7fa -->
