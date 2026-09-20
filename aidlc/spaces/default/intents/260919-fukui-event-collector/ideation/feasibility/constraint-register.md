# Constraint Register — 北陸ITイベント収集アプリ

上流成果物: `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`（intent-statement）

制約は「後続のステップが従わなければならない境界」である。ここに記載のない事項は制約ではなく、設計時の裁量として扱ってよい。

## 規約上の制約（connpass）

| ID | 制約 | 根拠 | 影響を受けるステップ |
|---|---|---|---|
| C-01 | connpass からのデータ取得は公式 API 経由のみ。スクレイピング・クローリング、その他 API 以外の方法でのアクセスは禁止（自動化の有無を問わない） | 利用規約 第7条第1項第17号 [S1][S2] | Domain Design、Functional Design、Code Generation |
| C-02 | API の利用には事前申請と審査が必要。APIキーは1つのみ発行される | 公式ヘルプ [S3] | 全体（キーが出るまで実データでの検証ができない） |
| C-03 | API へのアクセスは `X-API-Key` ヘッダでの認証が必要。APIキーはソースコードに埋め込まず、シークレットとして管理する | [S4]、org.md 構成フェーズのガードレール「Never hardcode credentials, API keys, or secrets」 | Code Generation、Infrastructure Design |
| C-04 | APIキーあたりのアクセス頻度に制限がある（1秒1リクエストとの報告。超過時 HTTP 429） | [S3][S4] | NFR Requirements、Functional Design、Code Generation |
| C-05 | 取得した利用者情報を、同意した利用目的以外で利用してはならず、第三者に譲渡・販売してはならない | API 利用規約 第9条第1項 [S7] | Domain Design、Functional Design |
| C-06 | 競合サービスの提供は禁止事項に含まれる | API 利用規約 第6条第1項 [S7] | 全体（公開ページの位置づけ） |
| C-07 | API の利用目的は申請時に申告した内容に従う。公開ページを作ることは申告済み | Q10=A、[S3] | 全体 |

## 技術的制約

| ID | 制約 | 根拠 | 影響を受けるステップ |
|---|---|---|---|
| C-08 | 実装言語は TypeScript。実行基盤は Cloudflare（Workers + Cron Triggers、D1、Pages） | Q4=A | Domain Design 以降すべて |
| C-09 | 費用は Cloudflare の無料枠の範囲に収める | Q5=A | Infrastructure Design、NFR Requirements |
| C-10 | オフライン開催の判定は、API の `prefecture` パラメータに福井・石川・富山を指定する方式による。レスポンスに開催形式を示すフィールドは存在しない | [S6]、Q3=A | Functional Design |
| C-11 | 対象エリアは福井を主対象とし、石川・富山も取得するが、画面上は福井と区別して扱う | intent-statement（Q9 of intent-capture） | Functional Design、Rough Mockups |

## 公開範囲の制約

| ID | 制約 | 根拠 | 影響を受けるステップ |
|---|---|---|---|
| C-12 | 公開ページは一般公開する | Q2、Q10=A | Rough Mockups、Functional Design |
| C-13 | RSS は認証付きで本人のみがアクセスできる状態にする。一般公開しない | Q9 | Functional Design、Code Generation |
| C-14 | 主催者名（`owner_nickname` / `owner_display_name`）は表示しない。扱うのはイベント情報のみ | Q7=A | Domain Design、Functional Design |

C-13 は intent-statement の「サイトとして公開し、RSS も出す」という記述の範囲を狭めるものである。公開ページの一般公開は変わらず、RSS のみ本人専用となる。

## 組織的制約

| ID | 制約 | 根拠 |
|---|---|---|
| — | なし。個人プロジェクトとして自由に進められる | Q8=A |
| — | 外部システムとの連携要件はなし。RSS 経由で Discord に繋ぐ可能性は残るが、要件ではない | Q6=A |

## 規制上の制約

収集対象は公開イベント情報であり、個人情報保護法上の要配慮情報、決済情報、医療情報のいずれも扱わない。PCI-DSS、HIPAA、SOC 2 のような規制フレームワークの適用対象外である。

唯一の個人情報に相当する項目は主催者のニックネーム・表示名だが、C-14 によりこれを扱わないため、個人データの保持は発生しない。

## Assumptions & Open Questions

- C-04 のレート制限の具体的な数値は利用報告に基づくものであり、公式ドキュメントで未確認。APIキー発行後にリファレンスで確認し、必要なら C-04 を更新する [assumption]
- C-06 が公開ページに及ぶかどうかは規約上明確でない。申請の審査結果が判断となる [assumption]
- C-09 の「無料枠の範囲に収める」ことの具体的な上限値（リクエスト数、ストレージ量、実行時間）は未確定。Infrastructure Design で確定する [assumption]
- C-13 の実現手段（URL トークン方式か HTTP Basic 認証か）は未確定。Functional Design で確定する [assumption]

## Sources

- [S1] connpass 利用規約 第7条第1項第17号 — https://connpass.com/term/
- [S2] connpass 公式アナウンス（2024年9月1日よりスクレイピングを禁止し利用規約に明記）— https://x.com/connpass_jp/status/1830480652430627088
- [S3] connpass API の利用について（公式ヘルプ）— https://help.connpass.com/api/
- [S4] connpass API v2 のレート制限・APIキー発行に関する利用報告 — https://zenn.dev/esusaki/articles/2b03fcbec86b1e 、https://qiita.com/kitazaki/items/80ca996089b979102b4e
- [S6] connpass API v2 クライアント実装のモデル定義（GetEventsQuery / ConnpassEvent のフィールド一覧）— https://pkg.go.dev/github.com/ryohidaka/go-connpass/models
- [S7] connpass API 利用規約 — https://help.connpass.com/api/api-term
- [Q1]〜[Q10] — `feasibility-questions.md` の確認事項と回答
