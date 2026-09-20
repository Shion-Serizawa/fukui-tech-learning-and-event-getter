<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-09-20T06:15:49Z — 3名の支援担当の指摘のうち、事実確認できるもの（.gitignore に .dev.vars がない／リモート未設定）は質問の前に自分で確認し、「先に確認した事実」として質問ファイル冒頭に置いた。意見と事実を混ぜないため。
- 2026-09-20T06:15:49Z — カバレッジ80%について、リードは「org.md 既定値」としたが、品質担当が org.md の対象スコープ一覧に greenfield-scraper-mvp が無いことを指摘。実際に org.md を読んで確認し、「義務ではなく推論」として質問に明記した。

<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
- 2026-09-20T06:40:42Z — Q10（リンタ選定）と Q4（テスト順序）が「おまかせ」で返ってきたため、委任された判断として提案し要約確認で追認を得た。Q10 は oxlint の型認識が2026-07に安定版になった事実を調べてから答えた。委任されても、根拠を調べずに既定値を置くことはしなかった。

<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-09-20T06:40:42Z — リード草案が「C-09 を確定させる場所が無い」と書いたが、state を確認すると infrastructure-design は EXECUTE だった。私も最初その誤りをそのままユーザーに伝えてしまい、質問ファイルでは訂正したが会話では3件として説明していた。委任先の報告を事実確認せずに中継したのが原因。
- 2026-09-20T06:40:42Z — スコープファイル .claude/scopes/aidlc-greenfield-scraper-mvp.md の散文が、recompose で4ステージを戻す前の状態のまま。recompose はグリッドと state を更新するが、スコープファイルの説明文までは直さない。計画変更時にスコープファイルの散文を見直す手順が要る。

- 2026-09-20T06:15:49Z — 3名の点検で「後で決めると書いた先が実行されないステップだった」ものが3件出た。うち1件（無料枠上限）はリードの誤認で infrastructure-design は実行対象に入っていた。残る2件（受け入れ条件、性能検証）は実在の穴で Q12 として人に投げた。計画を作る段階で、SKIP したステージへ申し送りしていないかの点検が要ると分かった。

<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
