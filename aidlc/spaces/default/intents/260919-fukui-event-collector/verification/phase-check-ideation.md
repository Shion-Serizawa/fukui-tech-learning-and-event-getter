# Phase Boundary Verification — Ideation → Inception

IDEATION フェーズの成果物どうしのつながりを検証した結果。INCEPTION へ進む前の確認である。

検証対象:
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/stakeholder-map.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/feasibility-assessment.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/constraint-register.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/raid-log.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/scope-definition/scope-document.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/scope-definition/intent-backlog.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/rough-mockups/wireframes.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/rough-mockups/user-flow.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/approval-handoff/initiative-brief.md`
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/approval-handoff/decision-log.md`

## 結果

**合格。** 欠落・孤立・矛盾はいずれも検出されなかった。

| 検査項目 | 結果 |
|---|---|
| 意図が記録されているか | 合格 |
| 範囲が定義されているか | 合格 |
| 実現可能性が確認されているか | 合格（1件の未解決リスクを明示した上で） |
| 取り組みが承認されたか | このステージの承認ゲートで判定 |
| 意図 → 範囲 → やることリストの一貫性 | 合格 |
| 範囲の各項目に実現可能性の裏付けがあるか | 合格 |

## 意図 → 範囲 → やることリストの追跡

intent-statement の Problem Statement が挙げる2つの側面が、範囲（S-01〜S-05）とやることリスト（B-01〜B-06）まで途切れずに繋がっているかを確認した。

| 問題の側面 | 成功条件 | 範囲 | proto-Unit | 画面 |
|---|---|---|---|---|
| 探索コスト | 収集元サイトを巡回する必要がなくなる | S-02（公開一覧）、S-03（エリア区別） | B-03 | W-01 |
| 機会損失 | 開催日より前に RSS へ配信された割合が 100% | S-04（個人用RSS） | B-04 | W-02 |
| （両者の前提） | — | S-01（収集）、S-02の保存 | B-01、B-02 | — |
| （前提の維持） | — | S-05（収集停止の検知） | B-05 | W-01 のフッター（一部） |

**欠落なし。** 2つの側面それぞれに、成功条件・範囲・proto-Unit・到達経路が対応している。

**孤立なし。** S-01〜S-05 のすべてが問題のいずれかの側面に対応し、B-01〜B-06 のすべてが S-01〜S-06 に対応している。画面 W-01・W-02 も同様である。

### 成功条件の測定可能性

ideation フェーズのガードレール「成功指標は測れるものであること」に照らして確認した。

| 成功条件 | 測定可能性 |
|---|---|
| 収集元サイトを巡回する回数がゼロになる | 測れる。本人の行動を数える |
| 開催日より前に RSS へ配信されたイベントの割合が 100% | 測れる。保存されたイベントの配信時刻と開催日を比較する |

本ステージ以前、機会損失側は「未確定」として記録されていた。本ステージ（D-41）で測れる形に確定させたため、この検査は合格となった。

## 範囲の各項目と実現可能性の対応

| 範囲 | 実現可能性の裏付け | 該当する制約 |
|---|---|---|
| S-01 収集 | API の `prefecture` パラメータで北陸3県を指定可能。1時間に1回・3県分はレート制限に収まる | C-01、C-02、C-03、C-04、C-10 |
| S-02 保存・公開一覧 | Cloudflare D1 + Pages。データ量は無料枠に収まる見込み | C-08、C-09 |
| S-03 エリア区別 | `prefecture` 指定と `address` / `place` が取得できる | C-10、C-11 |
| S-04 個人用RSS | 認証付き RSS は URLトークン方式または HTTP Basic 認証で実現可能 | C-13 |
| S-05 収集停止の検知 | 手段は未確定だが、実現可能性を疑う要素はない | C-09 |
| S-06 収集元の追加（Should） | 対象サイト未特定のため裏付けなし | — |

**S-06 のみ裏付けがない。** ただし Should であり最初のバージョンには含まれないため、INCEPTION の障害にはならない。着手前に対象サイトの調査が必要である旨を `decision-log.md` に記録済み。

## 矛盾の検査

以下の観点で成果物間の矛盾を探した。

| 観点 | 結果 |
|---|---|
| 範囲と制約の矛盾 | なし。S-01〜S-05 のいずれも C-01〜C-14 に違反しない |
| 範囲と費用の矛盾 | なし。1時間に1回の収集・北陸3県規模のデータ量は無料枠（C-09）に収まる |
| 範囲と画面の矛盾 | なし。W-01・W-02 は S-02〜S-05 に対応し、作らないものを画面に含めていない |
| 取得手段の一貫性 | なし。全成果物が「API 経由のみ」（C-01）で一貫している |
| 公開範囲の一貫性 | なし。「公開ページは一般公開、RSS は本人専用」が全成果物で一貫している |

### 解消済みの矛盾

IDEATION の途中で検出し、解消した矛盾を記録する。これらは現時点では残っていない。

| 矛盾 | 解消方法 | 解消した場所 |
|---|---|---|
| 初期の依頼は「福井の」だが、回答補足で「石川・富山も」とあった | 福井を主対象、石川・富山も取得し画面上は区別（D-01） | intent-capture [Q9] |
| 「公開・常時稼働まで含めたい」が、承認済みの計画（運用フェーズ全SKIP）と食い違っていた | 実行ステップに4件を追加（D-03） | intent-capture [Q10] |
| 「利用者は自分ひとり」と「サイトとして公開・RSS も出す」が利用者定義として整合しなかった | 自分が主な利用者だが、北陸のITコミュニティが見て分かる程度には整える（D-04） | intent-capture [Q11] |
| 初期の依頼にある「スクレイピングなどして収集する」が、connpass の利用規約と衝突していた | API 経由のみに確定（D-08） | feasibility |
| 「収集停止の検知」が範囲の Must にも Should にも入らず、承認済みの計画（`observability-setup` を追加したこと）と食い違っていた | Must に昇格（D-05 の S-05） | scope-definition [Q9] |

## 未解決事項の引き継ぎ

INCEPTION へ引き継ぐ未確定事項は10件、本プロジェクトの努力では解消できないものが4件ある。いずれも `decision-log.md` の「Assumptions & Open Questions」に確定させる場所とともに記録済みである。

このうち INCEPTION の最初のステップ（Practices Discovery）を妨げるものはない。

## 判定

**IDEATION → INCEPTION へ進んでよい。**

未解決のリスク R-01（API の利用審査が通らない）を抱えたまま進むが、これは意図的である。API キーがなくても設計と実装は進められ、実データでの確認だけがキー発行後に回る（D-09）。打ち切り条件も確定している（D-37）。

## Sources

- 検証対象として挙げた IDEATION フェーズの全成果物
- `.claude/knowledge/aidlc-shared/verification.md` — 検証の方法
- `decision-log.md` — D-01〜D-43、解消済みの未確定事項、変更された決定
