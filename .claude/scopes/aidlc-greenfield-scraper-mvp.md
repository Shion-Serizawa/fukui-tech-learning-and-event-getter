---
name: greenfield-scraper-mvp
depth: Standard
keywords: []
description: 新規リポジトリから定期収集型 Web アプリを作り切る合成スコープ
skeleton: on
change_control: relaxed
---

# greenfield-scraper-mvp scope

空のリポジトリから、外部サイトを定期的に収集して見せる Web アプリを作り切るために
合成したスコープです。新規プロダクトなので発見から設計までの背骨は残しつつ、単独
開発・公開データのみ・低リスクという実態に合わせて、市場調査、チーム編成、高精細
デザイン、契約設計、インフラ設計、運用フェーズ一式を畳んでいます。33 ステージ中
17 EXECUTE / 16 SKIP。

Change Control は relaxed です。承認や確認のあとで入力が変わった場合、その変更を
1 行で記録して知らせたうえで実行を続けます（承認をやり直しません）。ゲート自体が
減ることはありません。

## なぜこの EXECUTE なのか

このスコープが想定する仕事の最大の不確実性は「対象サイトからデータを取れるのか
（API か HTML か、利用規約とレート制限はどうか）」です。そこで `feasibility` を
設計の前に置いて先に潰します。加えて、リポジトリにテストもCIもビルド設定も存在
しないため `practices-discovery`・`build-and-test`・`ci-pipeline` を残し、検証の
土台を最初に立てます。収集・保存・表示という新規構造は `domain-design` と
`units-generation` で 3 ユニットに分け、`functional-design` が対象判定や重複排除
といった業務ルールを、`nfr-requirements` が取得間隔・レート制御・失敗検知・鮮度と
技術選定を確定させます。

## なぜこの SKIP なのか

- `market-research` / `team-formation`: 読者が既知の層で、単独開発。判断を変えない。
- `reverse-engineering`: greenfield（ステージの条件が brownfield 限定）。
- `user-stories`: ほぼ単一ペルソナで、受け入れ条件は `requirements-analysis` が持つ。
- `refined-mockups`: 一覧・絞り込み・詳細の定型 UI。`rough-mockups` の wireframes と
  user-flow の 1 パスで実装に足り、`code-generation` はモックを必須入力にしない。
- `contract-design` / `delivery-planning`: 外部公開 API がなく、ユニット 3 つの依存は
  収集→保存→表示の一本道。
- `nfr-design` / `infrastructure-design`: NFR が測定可能な単目標群で実装方式も定石。
  稼働先の選定は `nfr-requirements` の技術選定に載る。
- 運用フェーズ全 7 ステージ: デプロイ調整の関係者もオンコール体制もなく、明示的な
  性能目標もない。共有サービスとして常時稼働させる段階で `deployment-pipeline` と
  `observability-setup` を戻すのが自然な昇格先。

## Membership

キーワードトリガーはありません（`keywords: []`）。`--scope greenfield-scraper-mvp`
で明示的に指定したときだけ解決します。
