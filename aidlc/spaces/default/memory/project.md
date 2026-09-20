# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

- AI-DLC のステージが1つ承認されるごとに、そのステージの成果物を Conventional Commits 形式で1コミットにまとめてコミットする (learned 2026-09-20) <!-- cid:260919-fukui-event-collector:intent-capture:014053421d20d4e36e891c19386f071ddcc2bd2c34ca58c3724b7ec871448a3f -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Change Control

<!-- Project-specific. Mode: strict or relaxed. Strict here holds for every intent and cannot be changed from chat. -->

## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- 外部サービスに依存する機能を扱うステージでは、利用者に質問する前に、そのサービスの利用規約と API 仕様を自分で調査する。調査でわかった事実は質問の前提として提示し、利用者には判断が必要な点だけを聞く (learned 2026-09-20) <!-- cid:260919-fukui-event-collector:feasibility:b08f418f4ecb36ec725b582c7e90d3b68ad0fc74ffbad81b1f0fb7e5891d7b16 -->
- ステージの標準的な確認事項が、このプロジェクトでは確認する相手も対象も存在しない場合は、黙って省かずに、省いた項目と理由を質問ファイルの冒頭に表として示す (learned 2026-09-20) <!-- cid:260919-fukui-event-collector:approval-handoff:6f73967d6ff5afbeaf756d6f729f85585d561ec7d3d2646d06d99b9bb163e7fa -->
