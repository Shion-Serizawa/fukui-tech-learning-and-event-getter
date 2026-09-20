# RAID Log — 北陸ITイベント収集アプリ

上流成果物: `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`（intent-statement）

RAID = Risks（リスク）/ Assumptions（前提）/ Issues（現に起きている問題）/ Dependencies（依存）。
`feasibility-assessment.md` と `constraint-register.md` の内容を、追跡可能な単位に整理したもの。

## Risks（リスク）

発生するかどうかが未確定で、発生すれば影響があるもの。

| ID | リスク | 影響度 | 発生可能性 | 対応方針 |
|---|---|---|---|---|
| R-01 | connpass API の利用審査が通らない | 致命的 — connpass からの取得手段が消え、構想が成立しない。代替手段は規約上存在しない（C-01） | 評価不能（審査基準が非公開） | 受容。審査結果を待つ以外にできることがない。通らなかった場合は収集元の見直し（Q1=C 相当）に戻る |
| R-02 | 公開ページが API 利用規約の「競合サービスの提供」（C-06）に該当すると判断される | 大 — 公開ができない、または API 利用を停止される | 低〜中。申請時に公開ページを作る旨を申告済み（C-07）のため、審査結果がそのまま判断となる | 低減済み。申告内容と実装を一致させ続ける。乖離が生じそうな場合は事前に connpass へ確認する |
| R-03 | connpass API の仕様変更により収集が停止する | 中 — 修正までの間データが更新されない | 中。2024年に v1 から v2 への移行で認証方式とレート制限が変更された実績がある [S2][S4] | 低減。収集の失敗を検知できる仕組みを observability-setup で用意する。API 呼び出し箇所を1か所に閉じ込め、変更の影響範囲を限定する |
| R-04 | レート制限の実際の値が想定（1秒1リクエスト）と異なる | 小 — 収集方式の調整が必要になる程度 | 中。公式ドキュメントで未確認のため（A-01） | 低減。APIキー発行後にリファレンスで確認し、NFR Requirements までに確定させる |
| R-05 | 主催者の都道府県設定漏れにより、北陸開催のイベントを取りこぼす | 中 — 成功指標「収集元サイトを巡回する必要がなくなる」が部分的に達成されない | 中〜高。主催者の入力に依存するため | 受容（Q3=A で許容済み）。取りこぼしの程度は実データで確認する。補正が必要になった場合、`address` / `place` / `lat` / `lon` が材料として使える |
| R-06 | ハイブリッド開催のイベントが `online` 側に登録されており、取得対象から漏れる | 小〜中 | 中。主催者の登録方法が一貫しないため | 受容（Q3=A）。R-05 と同じ材料で将来補正できる |

## Assumptions（前提）

現時点で確認できておらず、真であることを前提に進めるもの。誤っていた場合は計画の見直しが必要になる。

| ID | 前提 | 検証時期 | 誤っていた場合の影響 |
|---|---|---|---|
| A-01 | connpass API のレート制限は APIキーあたり 1秒1リクエストである | APIキー発行後、リファレンスで確認 | 収集方式の調整が必要（R-04） |
| A-02 | API 利用申請は承認される | 審査結果の受領時 | 構想が成立しない（R-01） |
| A-03 | API 利用規約の「競合サービスの提供」禁止は、本件の公開ページには及ばない | 審査結果の受領時 | 公開ができない（R-02） |
| A-04 | Cloudflare の無料枠で、定期取得・保存・公開ページ・RSS のすべてを賄える | Infrastructure Design | 費用が発生する。Q5=A（無料枠のみ）と矛盾するため、構成か範囲の見直しが必要 |
| A-05 | `prefecture` 指定による絞り込みで、実用上十分な精度で北陸のオフラインイベントを取得できる | 実データ取得後 | 判定方式の見直しが必要（R-05、R-06） |
| A-06 | RSS に認証をかけても、本人が使う RSS リーダーで読める | Functional Design / 実装時 | URL トークン方式と HTTP Basic 認証のうち、動くほうを選ぶ。両方とも駄目なら Q9 の代替案（個人 Discord への bot）に戻る |

## Issues（現に起きている問題）

| ID | 問題 | 状態 | 対応 |
|---|---|---|---|
| I-01 | APIキーが未発行のため、実データでの検証ができない | 進行中。申請は提出済みで返信待ち（Q1=A） | 設計はキーが使える前提で進める（Q1=A の選択）。実データでの検証を要する判断は、キー発行後まで保留する |

## Dependencies（依存）

自分の作業では完結せず、外部に依存するもの。

| ID | 依存先 | 内容 | 状態 |
|---|---|---|---|
| D-01 | connpass 運営 | API 利用申請の審査・APIキーの発行 | 申請提出済み、返信待ち。発行まで約1週間との報告 [S4] |
| D-02 | connpass API | イベントデータの供給。本件で唯一の収集元 | 稼働中。仕様変更のリスクは R-03 |
| D-03 | Cloudflare | Workers / Cron Triggers / D1 / Pages の提供と無料枠 | 稼働中 |

## Assumptions & Open Questions

- 収集の実行間隔は未確定。NFR Requirements で確定する [assumption]
- 収集が停止したことをどう検知し、どこへ通知するかは未確定。NFR Requirements と observability-setup で確定する [assumption]
- connpass 以外の収集元を将来追加するかどうかは未確定（intent-statement から継続）[assumption]
- R-01 が現実化した場合にどの収集元へ切り替えるかは未検討。現時点では代替候補を調査していない [assumption]

## Sources

- [S2] connpass 公式アナウンス（2024年9月1日よりスクレイピングを禁止し利用規約に明記）— https://x.com/connpass_jp/status/1830480652430627088
- [S4] connpass API v2 のレート制限・APIキー発行に関する利用報告 — https://zenn.dev/esusaki/articles/2b03fcbec86b1e 、https://qiita.com/kitazaki/items/80ca996089b979102b4e
- [S7] connpass API 利用規約 — https://help.connpass.com/api/api-term
- [Q1]〜[Q10] — `feasibility-questions.md` の確認事項と回答
- `feasibility-assessment.md`、`constraint-register.md` — 本ログの各項目の詳細な根拠
