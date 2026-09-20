# Decision Log — IDEATION フェーズ

IDEATION の5ステップで下したすべての決定の記録。後続ステップが同じ問いを再提起しないための参照先である。

上流成果物:
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`（intent-statement）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/stakeholder-map.md`（stakeholder-map）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/feasibility-assessment.md`（feasibility-assessment）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/constraint-register.md`（constraint-register）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/scope-definition/scope-document.md`（scope-document）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/scope-definition/intent-backlog.md`（intent-backlog）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/rough-mockups/wireframes.md`（wireframes）

## 決定の一覧

### 対象と範囲

| ID | 決定 | 根拠 | 決めた場所 |
|---|---|---|---|
| D-01 | 対象エリアは福井を主対象とし、石川・富山も取得する。画面上は区別する | 当初の依頼は福井のみだったが、石川・富山も入れたいという補足があった | intent-capture [Q9] |
| D-02 | 公開・常時稼働までを範囲に含める | 手元で動くまでに留めない | intent-capture [Q8][Q10] |
| D-03 | 上記に伴い、実行ステップに `nfr-design`、`infrastructure-design`、`deployment-pipeline`、`observability-setup` を追加（17 → 21） | 公開・常時稼働には稼働先の構成と監視の設計が要る | intent-capture 後の計画変更 |
| D-04 | 主な利用者は本人。公開はするが、他者向けの作り込みを最優先にはしない | 動機は自分の用途。公開する以上、北陸のITコミュニティが見て分かる程度には整える | intent-capture [Q2][Q11] |
| D-05 | 最初のバージョンは Must 5件（収集・保存・公開一覧・個人用RSS・収集停止の検知） | 互いを補完して初めて成功指標を満たす構造 | scope-definition [Q1][Q9] |
| D-06 | 将来やることは connpass 以外の収集元の追加のみ | | scope-definition [Q2] |
| D-07 | 検索、絞り込み、並び替え、過去イベントの遡り閲覧、ログイン、申込み、お気に入り、他者への通知、スマホアプリは作らない | 範囲外を明記して後から迷わないため | scope-definition [Q2][Q8] |

### 取得手段と制約

| ID | 決定 | 根拠 | 決めた場所 |
|---|---|---|---|
| D-08 | connpass からの取得は公式 API 経由のみ。スクレイピングは行わない | 利用規約 第7条第1項第17号で禁止（2024年9月1日より明記）。迂回路は存在しない | feasibility（C-01） |
| D-09 | API 利用申請を出し、審査結果を待つ間も設計・実装を進める。実データでの確認のみキー発行後に回す | 待ち時間を作らないため | feasibility [Q1]、scope-definition [Q3] |
| D-10 | 申請には公開ページを作る旨を申告する | 申告内容と実装を一致させ、事後の問題化を避ける | feasibility [Q10]（C-07） |
| D-11 | オフライン開催の判定は `prefecture` パラメータに福井・石川・富山を指定する方式による。取りこぼしや誤判定は許容する | レスポンスに開催形式を示すフィールドが存在しないため | feasibility [Q3]（C-10） |
| D-12 | 主催者名（`owner_nickname` / `owner_display_name`）は扱わない | 個人データの保持を発生させないため | feasibility [Q7]（C-14） |

### 技術と費用

| ID | 決定 | 根拠 | 決めた場所 |
|---|---|---|---|
| D-13 | TypeScript / Cloudflare（Workers + Cron Triggers、D1、Pages）で構成する | | feasibility [Q4]（C-08） |
| D-14 | 費用は Cloudflare の無料枠の範囲に収める。期限は設けない | | feasibility [Q5]（C-09） |
| D-15 | 外部システムとの連携は要件としない。RSS 経由で Discord に繋ぐ可能性は残す | | feasibility [Q6] |

### 公開範囲

| ID | 決定 | 根拠 | 決めた場所 |
|---|---|---|---|
| D-16 | 公開ページは一般公開する | | feasibility [Q2][Q10]（C-12） |
| D-17 | RSS は認証付きで本人のみがアクセスできる状態にする。一般公開しない | intent-statement の「公開サイト + RSS」の範囲を狭める決定 | feasibility [Q9]（C-13） |
| D-18 | RSS に認証をかけることは技術的に可能と判断し、代替案（個人 Discord への bot）は採らない | URLトークン方式なら RSS リーダーの実装に依存せず動作する | feasibility [Q9] への技術判断 |

### 見せ方

| ID | 決定 | 根拠 | 決めた場所 |
|---|---|---|---|
| D-19 | 表示するのは、これから開催されるもの + 直近1〜2週間に終了したもの | | scope-definition [Q4] |
| D-20 | 福井を先に、石川・富山をその後にまとめて表示する | 福井が主対象であるため | scope-definition [Q5] |
| D-21 | 一覧に出すのはタイトル・日時・場所のみ。詳細は connpass へのリンクで飛ばす | 転載の範囲を抑える判断でもある | scope-definition [Q6] |
| D-22 | 上記に加えて県名バッジ、定員と参加者数、ハッシュタグを表示する | | rough-mockups [Q2] |
| D-23 | 主に PC の画面幅を想定する。スマートフォンでも読めることを最低限とする | | rough-mockups [Q1] |
| D-24 | 終了したイベントは一覧の下部に「終了したイベント」としてまとめる | これから開催されるものと混在させない | rough-mockups [Q3] |
| D-25 | 最終収集日時をフッターに表示する。更新が途絶えた場合の警告表示は作らない | S-05 の一部を画面で担う | rough-mockups [Q4] |
| D-26 | イベントが0件の期間は「該当する期間に開催されるイベントはありません」と明示し、最終収集日時も併せて出す | 「壊れている」のか「本当にない」のかを区別できるようにするため | rough-mockups [Q5] |
| D-27 | ある程度は見栄えを整える。配色やカードのような区切りを入れる | 高精細デザインのステップを外しているため、この方針が実装の指針になる | rough-mockups [Q6] |
| D-28 | アクセシビリティは基本（見出し構造、キーボード操作、代替テキスト、色だけに頼らない表現）を押さえる。WCAG 2.1 AA 準拠は明示的な目標としない | | rough-mockups [Q7] |
| D-29 | 福井が0件の場合は見出しを残し、該当がない旨の一文を置く。石川・富山が0件の場合は見出しごと省く | 福井は主対象であり、見出しが消えると「集めていない」のか「0件」なのかが区別できない | rough-mockups レビュー R-01 |
| D-30 | エラー状態では最終収集日時も表示しない | イベントと最終収集日時は同じ保存先から読むため、イベントが読めない状況では日時も読めない | rough-mockups レビュー R-02 |
| D-31 | これから開催されるものが3県とも0件で終了したイベントだけがある場合は、「終了したイベント」の節だけを出す | | rough-mockups レビュー R-03 |
| D-32 | 公開ページから RSS への導線は置かない | 導線を置くと本人専用である意味が失われる | rough-mockups |
| D-33 | connpass 側のリンク先が生きているかは確認しない | 確認するとレート制限（C-04）と規約（C-01）の両面で割に合わない | rough-mockups |
| D-34 | 読み込み中の状態は専用に設計しない | 保存済みデータを表示するだけで外部への問い合わせを伴わないため | rough-mockups |

### 進め方

| ID | 決定 | 根拠 | 決めた場所 |
|---|---|---|---|
| D-35 | 作る順番はリスク先行を基本とし、依存順に積む。B-01/B-02 を最初に端から端まで通す | connpass からの取得が唯一こちらで評価できない不確実性であるため | scope-definition [Q7] |
| D-36 | 優先順位づけは MoSCoW を用い、WSJF / RICE は用いない | 単独開発・期限なし・複数チームの並行なしの条件では、スコアリングの手間が判断の質に還元されない | scope-definition |
| D-37 | R-01（API 審査が通らない）の打ち切り条件は進捗で引く。実装が完了して実データ待ちだけになった時点で代替手段の検討に入る | 待ち続けること自体が判断の先送りになるため | approval-handoff [Q1] |

### 本ステージで確定したもの

| ID | 決定 | 根拠 | 決めた場所 |
|---|---|---|---|
| D-38 | 収集の実行間隔は1時間に1回 | | approval-handoff [Q2] |
| D-39 | RSS の配信範囲は3県すべて | | approval-handoff [Q2] |
| D-40 | 「これから開催されるもの」の判定には開催日を使う（申込期限ではない） | | approval-handoff [Q2] |
| D-41 | 機会損失の解消を測る成功条件は「開催日より前に RSS へ配信されたイベントの割合が 100%」 | 「RSS に配信されれば気づける」という本人の判断を測れる形に言い換えたもの。見逃しの原因を「RSS に載らなかった」と「載ったが読まなかった」に分離できる | approval-handoff [Q2] |
| D-42 | S-05（収集停止の検知）の具体的な手段は後続ステップに委ねる | | approval-handoff [Q2] |
| D-43 | IDEATION の決定は見直さず、このまま INCEPTION へ進む | | approval-handoff [Q3] |

## 途中で解消された未確定事項

intent-capture の時点で未確定として記録され、後続ステップで解消されたもの。引き継ぎ時に未解決のものと混同しないよう区別する。

| 当初の未確定事項 | 解消された内容 | 解消した場所 |
|---|---|---|
| connpass から定期的にデータを取得できるか | API のみ可。申請制・審査あり。レート制限は1秒1リクエスト | feasibility |
| 取得方式を API とスクレイピングのどちらにするか | API 一択（規約でスクレイピング禁止） | feasibility（D-08） |
| 公開先（どこで動かし、どこで配信するか） | Cloudflare で確定 | feasibility（D-13） |
| 「福井/石川/富山開催」をどのデータ項目から判定するか | `prefecture` パラメータ | feasibility（D-11） |
| 収集の実行間隔 | 1時間に1回 | approval-handoff（D-38） |
| RSS で配信する範囲 | 3県すべて | approval-handoff（D-39） |
| 「これから開催されるもの」の判定に開催日と申込期限のどちらを使うか | 開催日 | approval-handoff（D-40） |
| 「見逃し防止」を測る成功条件 | 開催日より前に RSS へ配信された割合が 100% | approval-handoff（D-41） |

## 変更された決定

| 元の決定 | 変更後 | 理由 | 変更した場所 |
|---|---|---|---|
| 「サイトとして公開し、RSS も出す」（intent-capture） | 公開ページは一般公開、RSS は認証付き本人専用（D-17） | API 利用申請に RSS を含めていなかったため | feasibility [Q2][Q9] |
| 実行ステップ 17件（当初の承認プラン） | 21件（D-03） | 公開・常時稼働を範囲に含めたため | intent-capture 後 |

## Assumptions & Open Questions

INCEPTION へ引き継ぐ未解決の前提。

| 未確定事項 | 確定させる場所 |
|---|---|
| 「収集が止まった」と判定する基準と、どこへどう知らせるか | NFR Requirements、observability-setup |
| RSS の認証方式（URL トークン方式か HTTP Basic 認証か） | Functional Design |
| 「直近1〜2週間」の具体的な日数 | Functional Design |
| 重複排除の判定基準（connpass のイベント ID を使うか、他の項目も見るか） | Domain Design |
| Cloudflare 無料枠の具体的な上限値 | Infrastructure Design |
| API レート制限の公式な数値 | APIキー発行後にリファレンスで確認 |
| ハッシュタグ表示時に connpass のハッシュタグ検索へリンクするか | Functional Design |
| 1ページに何件まで表示するか | Functional Design |
| 配色・字形・余白の具体値 | 実装時（Refined Mockups を実行しないため） |
| S-06 の対象となる収集元 | 未定（Should のため急がない） |

以下は本プロジェクトの努力では解消できないもの。

- API 利用審査の通過可能性は評価できない [assumption]
- 「競合サービスの提供」禁止が本件の公開ページに及ぶかは規約上明確でない [assumption]
- 主催者の都道府県設定漏れによる取りこぼしの程度は実データを取得するまで不明 [assumption]
- R-01 が現実化した場合の切り替え先は未検討。打ち切り条件（D-37）は決めたが、切り替え先は決めていない [assumption]

## Sources

- [Q1]〜[Q3] — `approval-handoff-questions.md` の確認事項と回答
- intent-capture の [Q1]〜[Q11]、feasibility の [Q1]〜[Q10]、scope-definition の [Q1]〜[Q9]、rough-mockups の [Q1]〜[Q7] — 各ステップの確認事項と回答
- constraint-register — C-01〜C-14
- feasibility-assessment — R-01〜R-06、A-01〜A-06
- scope-document、intent-backlog — S-01〜S-06、B-01〜B-06
- wireframes — W-01、W-02、レビュー指摘 R-01〜R-03
