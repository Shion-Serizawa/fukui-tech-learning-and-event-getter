# Intent Statement — 北陸ITイベント収集アプリ

## Problem Statement

北陸で開催されるIT系イベント・勉強会の情報が複数のサイトに散らばっており、探すのに手間がかかる。福井開催のものだけを絞り込むことが難しく他県のイベントに埋もれる、気づいたときには申込期限や開催日が過ぎている、そもそもどんなイベントがあるのかを知る機会がない、という困りごとが同時に発生している [Q1]。

加えて、イベントを探すたびに同じ検索手順を繰り返すこと自体が負担になっている [Q1]。

この困りごとは2つの側面を持つ。ひとつは**探索コスト** — 情報が散らばっているために、探すこと自体に手間がかかる [Q1]。もうひとつは**機会損失** — 探索が間に合わず、申込期限や開催日を過ぎてから気づく [Q1][Q4]。

## Target Customer

主な利用者は本人であり、自分用のツールとして作る [Q2]。ただしサイトとして公開し、RSSも提供する [Q2]。

公開する以上、北陸のITコミュニティの人が見ても内容が分かる程度には整えるが、他者向けの作り込みを最優先にはしない。基準はあくまで本人の使い勝手に置く [Q11]。

本人が受けている便益は、Problem Statement に挙げた探索コストと見逃しの解消である [Q1]。

## Success Metrics

### 探索コストの解消（確定）

福井のイベントを探すために、conpass等のサイトを自分で巡回する必要がなくなること [Q3]。

- 測定方法: 本人が福井のIT勉強会を探す際、収集元サイトを直接巡回する回数がゼロになる状態 [Q3]
- この指標は Problem Statement の「探索コスト」の側面に直接対応する [Q1]

### 機会損失の解消（未確定）

Problem Statement の「機会損失」の側面（申込期限や開催日を過ぎてから気づく [Q1]）と Initiative Trigger（実際にイベントを見逃した経験 [Q4]）に対応する成功条件は、現時点では確定していない。[Q3] で選択されたのは探索コストの指標のみである [Q3]。

- この側面を測るには「開催のどれだけ前に気づけていれば見逃さなかったと言えるか」を決める必要があるが、その基準は未確定である [assumption]
- 候補となる測り方: 収集対象期間内に開催されたイベントのうち、開催日または申込期限より前に本人が認識できた割合 [assumption]
- この指標が確定するまで、後続のステップは機会損失の解消を検証できない。Requirements Analysis までに確定させる必要がある [assumption]

## Initiative Trigger

実際にイベントを見逃した、あるいは探すのに苦労した経験があったため [Q4]。

## Initial Scope Signal

### 収集対象の地域

福井を主対象とし、石川・富山も取得する。ただし画面上は福井と区別して扱う [Q9]。

（初期のご依頼は福井のみを挙げていた [desc]。石川・富山への拡大は Q9 で確定した内容である。）

### 収集対象のサイト

当初の対象として connpass を想定 [desc]。

- 取得可否・利用規約・レート制限の確認は Feasibility & Constraints 段階で行う [assumption]

### 製品境界

公開・常時稼働までを今回の範囲に含める [Q8][Q10]。手元で動くところまでに留めず、公開先へのデプロイ手順の整備と、定期取得が停止したことに気づける仕組みの構築を含む [Q10]。

### Workflow-selected scope

`greenfield-scraper-mvp` (workflow-selected) [scope]。

この workflow-selected scope は、当初 [Q8] の回答（公開・常時稼働まで含めたい）と一致していなかった。[Q10] の回答を受けて、実行ステップに `nfr-design`、`infrastructure-design`、`deployment-pipeline`、`observability-setup` を追加し、ユーザーが確認した製品境界と一致させた [Q10]。

## Assumptions & Open Questions

- 「機会損失（見逃し）の解消」を測る成功条件が未確定である。開催のどれだけ前に気づけていれば見逃さなかったと言えるかの基準が決まっていないため、この側面の達成可否を検証できない。Requirements Analysis までに確定させる必要がある [assumption]
- connpass から定期的にデータを取得できるかどうか（API の有無、利用規約上の可否、レート制限）は未確認である。取得方式を API とスクレイピングのどちらにするかも、この確認結果を踏まえて検討する [assumption]
- 「オフライン開催」および「福井/石川/富山開催」をどのデータ項目から判定するかは未確定である [assumption]
- 収集の実行間隔は未確定である [assumption]
- RSS で配信する範囲（全件か、福井のみか、絞り込み条件付きか）は未確定である [assumption]
- 公開先は Cloudflare を想定しているが、確定していない [assumption]
- connpass 以外の収集元を将来追加するかどうかは未確定である [assumption]

これらの未確定事項は、確認済みの事実ではなく前提として保持する。ユーザーは Assumption Confirmation で `A. Accept assumptions` を選択しており、後続のステップ（Feasibility & Constraints 以降）で解消する [assumption]

## Sources

- [desc] Initial description: "福井のオフラインで開催されるITイベント・勉強会を定期的にスクレイピングなどして収集するwebアプリを作りたい。とりあえずconpassが対象になりそう"
- [scope] Workflow-selected scope: `greenfield-scraper-mvp`.
- [Q1] — 解決したい困りごと（intent-capture-questions.md）
- [Q2] — 主な利用者（intent-capture-questions.md）
- [Q3] — 成功の判断基準（intent-capture-questions.md）
- [Q4] — 着手のきっかけ（intent-capture-questions.md）
- [Q8] — 作る範囲の確認（intent-capture-questions.md）
- [Q9] — 収集対象の地域（intent-capture-questions.md）
- [Q10] — 公開・常時稼働を範囲に含めるか（intent-capture-questions.md）
- [Q11] — 利用者の定義（intent-capture-questions.md）
