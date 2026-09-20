<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-20T03:47:20Z — ステージ定義の例示質問（主要画面、情報階層、既存デザインシステム）の多くが scope-definition で既決だったため、未決の7点に絞った。画面が実質1枚なので、情報階層より「1件に何を載せるか」と「終了イベントの区別」が実質的な設計判断になると解釈した。
- 2026-09-20T03:47:20Z — Refined Mockups が実行ステップから外れているため、この段階の決定がそのまま実装の指針になる。通常の rough-mockups より見た目の方針（Q6）まで踏み込んで聞いた。

<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-20T03:57:10Z — 読み込み中の状態を専用に設計しなかった。ガイドは5状態すべての設計を求めるが、保存済みデータを表示するだけで外部への問い合わせを伴わないため、専用設計の対象がないと判断し、その旨を artifact に明記した。

<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-09-20T03:57:10Z — 見出しで節を分けているのに終了イベントへ重ねて「終了」表示を付けた。冗長だが、スクロール位置によっては見出しが画面外にあり、どの節を見ているか分からなくなるため。走査しやすさを優先した。
- 2026-09-20T03:57:10Z — connpass 側のリンク先の生存確認は行わないと決めた。確認するとレート制限（C-04）と規約（C-01）の両面で割に合わないため。404 に飛ぶ可能性は受容する。

<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
