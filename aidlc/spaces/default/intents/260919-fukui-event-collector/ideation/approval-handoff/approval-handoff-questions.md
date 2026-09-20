# Initiative Approval & Handoff — 確認事項

上流成果物（IDEATION フェーズの全成果物）:
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`（intent-statement）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/stakeholder-map.md`（stakeholder-map）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/feasibility-assessment.md`（feasibility-assessment）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/constraint-register.md`（constraint-register）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/scope-definition/scope-document.md`（scope-document）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/scope-definition/intent-backlog.md`（intent-backlog）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/rough-mockups/wireframes.md`（wireframes）

## 質問を絞った理由

このステージの標準的な確認事項のうち、以下は本プロジェクトでは確認する相手も対象も存在しないため省いています。

| 標準的な確認事項 | 省いた理由 |
|---|---|
| 関係者全員が意図と範囲に合意しているか | 決定者は本人のみ（stakeholder-map）。合意を取る相手がいない |
| 予算・リソースの確約があるか | 費用は無料枠のみで確定済み（C-09）、期限なし |
| チームは編成され日程が組まれているか | 単独開発。Team Formation は実行ステップから外してある |
| 市場調査は投資を裏付けているか | Market Research は実行ステップから外してある |
| 粗いモックは共有された構想を反映しているか | 直前のステップで承認済み |

残るのは、本人が決める必要のある3点です。

---

## Q1. connpass の API 審査が長引いた場合の打ち切り条件を、いま決めておきますか？

RAID の R-01（審査が通らない）に対して、現状の対応方針は「受容。待つ以外にできることがない」です。しかし待ち続けること自体が意思決定の先送りになるため、線を引いておくかを確認します。

なお feasibility では、審査が通らなかった場合にどの収集元へ切り替えるかは未検討であることも記録しています。

- A. 決めない。審査結果が出るまで待ち、出てから考える
- B. 期間で線を引く（例: 発行まで1か月を超えたら代替手段を検討する。日数は補足に記載）
- C. 進捗で線を引く（例: 実装が完了して実データ待ちだけになった時点で代替手段を検討する）
- D. Not yet defined（判断できない／相談したい）
- X. Other (please specify)

[Answer]:C

---

## Q2. INCEPTION（要件定義・設計）で必ず確定させたい未確定事項はどれですか？（複数選択可）

IDEATION を通して未確定事項が積み上がっています。多くは後続ステップで自然に確定しますが、優先して潰したいものがあれば指定してください。

なお以下は、IDEATION の途中で確定済みです（intent-capture 時点では未確定でした）。

- connpass からデータを取得できるか → API のみ可、申請制と判明（feasibility）
- 取得方式を API とスクレイピングのどちらにするか → API 一択（C-01）
- 公開先 → Cloudflare で確定（C-08）
- 「福井/石川/富山開催」の判定方法 → `prefecture` パラメータで確定（C-10）

残っている主な未確定事項は次のとおりです。

- A. 「見逃し防止」を測る成功条件（開催のどれだけ前に気づけていれば見逃さなかったと言えるか）
- B. 収集の実行間隔
- C. 「収集が止まった」と判定する基準と、どこへどう知らせるか（S-05 の具体化）
- D. RSS の認証方式と配信範囲（福井のみか3県すべてか）
- E. 「これから開催されるもの」の判定に開催日と申込期限のどちらを使うか
- X. Other (please specify)

[Answer]:A （個人的には）RSS配布で気づけばOK、B 1hに1回 C 後続でやるなら任せる、やらないなら質問して D 配信範囲は全部 E 開催日

---

## Q3. IDEATION で決めたことのうち、いま見直したいものはありますか？

INCEPTION に入ると、ここで決めた範囲と制約を前提に要件と設計を組み立てます。後から覆すと手戻りが大きくなるため、最後に確認します。

- A. 見直したいものはない。このまま INCEPTION へ進む
- B. 範囲（作るもの・作らないもの）を見直したい（補足に記載）
- C. 対象エリアや公開範囲を見直したい（補足に記載）
- D. 技術スタックの前提を見直したい（補足に記載）
- X. Other (please specify)

[Answer]:A

---

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
