# Intent Backlog — 北陸ITイベント収集アプリ

上流成果物:
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`（intent-statement）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/feasibility-assessment.md`（feasibility-assessment）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/constraint-register.md`（constraint-register）
- `scope-document.md` — 本バックログの範囲の定義

ここに並ぶのは **proto-Unit**（後続の Units Generation で実装単位に分解される前の、価値の単位）である。実装単位そのものではない。

## 優先順位（MoSCoW）

単独の個人プロジェクトであり、複数チームの並行や期限がないため、WSJF や RICE のような定量スコアリングは採らない。判断材料は「成功指標への寄与」と「依存関係」の2つに絞る。

| ID | proto-Unit | 優先度 | 成功指標への寄与 | 依存 |
|---|---|---|---|---|
| B-01 | イベント収集 — connpass API から北陸3県のイベントを定期的に取得する | Must | 前提。これなしに他のすべてが成立しない | なし |
| B-02 | イベント保存 — 取得したイベントを保存し、重複を排除して最新の状態を保つ | Must | 前提。表示と配信の供給元 | B-01 |
| B-03 | 公開イベント一覧 — これから開催されるイベントと直近終了分を、福井優先の順序で一覧表示する | Must | 探索コストの解消に直結。成功指標の本体 | B-02 |
| B-04 | 個人用 RSS 配信 — 認証付きで新着イベントを配信する | Must | 機会損失（見逃し）の解消。見に行かなくても届く | B-02 |
| B-05 | 収集の健全性の可視化 — 収集が止まったことに気づける状態にする | Must | 上記すべての前提の維持。止まったことに気づけなければ成功指標が崩れる | B-01 |
| B-06 | 収集元の追加 — connpass 以外のイベント情報源に対応する | Should | 網羅性の向上。ただし現時点で対象サイトが未特定 | B-01、B-02 |

Must が5つあるのは、これらが互いを補完して初めて成功指標を満たすためである。B-01・B-02 は前提、B-03・B-04 は2つの異なる到達経路（見に行く／届く）、B-05 は前提の維持にあたる。どれか1つを落とすと、成功指標のいずれかの側面が欠ける。

## 価値の流れ

```
[connpass API]
      |
      v
 B-01 収集  --(取得できなくなったら)--> B-05 健全性の可視化 --> 本人が気づく
      |
      v
 B-02 保存
      |
      +-------------------+
      |                   |
      v                   v
 B-03 公開一覧        B-04 個人用RSS
      |                   |
      v                   v
  見に行けば分かる     見に行かなくても届く
      |                   |
      +---------+---------+
                |
                v
   成功指標: 収集元サイトを巡回する必要がなくなる
```

<!-- Text fallback: connpass API を起点に B-01（収集）が動き、そこから B-02（保存）へ流れる。B-02 は B-03（公開一覧）と B-04（個人用RSS）の両方に分岐し、前者は「見に行けば分かる」、後者は「見に行かなくても届く」という2つの経路で成功指標に到達する。B-05（健全性の可視化）は B-01 を監視し、取得できなくなったときに本人へ知らせる。 -->

## 推奨する着手順序

`scope-document.md` で確定した方針（リスク先行を基本とし、依存順に積む）に沿った順序。

| 順 | proto-Unit | この順にする理由 |
|---|---|---|
| 1 | B-01 → B-02 | connpass からの取得が唯一こちらで評価できない不確実性（feasibility R-01、R-03、R-05）。ここを端から端まで通し、API キーが届いた時点で真っ先に実データで検証できる状態にする |
| 2 | B-05 | B-01 の直後に置く。収集が動き出した時点から健全性が見えていないと、以降の作業中に静かに壊れても気づけない |
| 3 | B-03 | 供給元（B-02）が安定してから作る。成功指標への寄与が最も大きい |
| 4 | B-04 | B-03 と同じ供給元を使うため、後に回しても手戻りが少ない。認証方式の検討が必要な分だけ B-03 より重い |
| 5 | B-06 | Should。Must がすべて動いてから着手する |

B-03 と B-04 は依存関係上は並行可能だが、単独作業のため順に進める前提で並べた。

最終的な実装単位への分解と順序の確定は Units Generation と Delivery Planning で行う。本表はその入力である。

## 範囲外（バックログに載せないもの）

`scope-document.md`「作らないもの」に挙げた項目は、バックログに登録しない。キーワード検索、絞り込み・並び替え、過去イベントの遡り閲覧、ログイン、申込み機能、お気に入り管理、自分以外への通知、スマートフォンアプリがこれにあたる。

## Assumptions & Open Questions

- B-05 の具体的な手段（何をもって「止まった」と判定し、どこへどう知らせるか）は未確定。NFR Requirements および observability-setup で確定する [assumption]
- B-01 の実行間隔は未確定。NFR Requirements で確定する [assumption]
- B-04 の認証方式と配信範囲（福井のみか3県すべてか）は未確定。Functional Design で確定する [assumption]
- B-06 の対象となる収集元は未特定。connpass 以外にどのサイトを対象とするかを調査していない [assumption]
- B-02 の重複排除の判定基準（connpass のイベント ID を使うか、他の項目も見るか）は未確定。Domain Design で確定する [assumption]
- B-03 の「これから開催されるもの」の判定に、開催日と申込期限のどちらを使うかは未確定 [assumption]

## Sources

- [Q1]〜[Q9] — `scope-definition-questions.md` の確認事項と回答
- `scope-document.md` — 範囲の境界、見せ方、進め方の決定
- constraint-register — C-01、C-09、C-11、C-13、C-14
- feasibility-assessment — R-01、R-03、R-05（着手順序の根拠）
- intent-statement — 成功指標（価値の流れの到達点）
