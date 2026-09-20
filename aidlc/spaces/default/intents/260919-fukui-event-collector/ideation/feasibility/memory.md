<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-20T02:39:21Z — Q9 の条件つき回答（「認証が技術的に可能ならやる、無理ならDiscord bot」）を、こちらの技術判断で「可能」側に確定させた。URLトークン方式なら RSS リーダーの実装に依存せず確実に動くため。判断をユーザーに投げ返さず、根拠を示して確定させ、要約確認で同意を取る形を選んだ。

<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->

## Interpretations
- 2026-09-20T02:00:03Z — 質問を書く前に connpass の取得可否を実地調査した。この段階の目的が「設計前に最大の未知を潰す」ことなので、ユーザーに「取得できますか」と聞くのではなく、規約とAPI仕様を自分で確認してから、判断が必要な点だけを質問にした。

## Deviations
- 2026-09-20T02:00:03Z — ステージ定義の例示質問は汎用的（既存システム、規制、スタック、予算、AWS利用状況）だが、AWS の利用状況は聞いていない。intent-capture で公開先として Cloudflare が挙がっており、AWS を前提にする根拠がないため。代わりに Cloudflare 前提の確認に差し替えた。

## Open questions
- 2026-09-20T02:00:03Z — connpass API 利用規約の「競合サービスの提供」禁止が、イベント情報を集約して公開するサイトに及ぶかどうかは規約上不明。申請時の審査結果で実際に判明するため、それまでは前提として扱うしかない。
