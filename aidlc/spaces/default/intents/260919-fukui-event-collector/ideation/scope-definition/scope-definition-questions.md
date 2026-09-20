# Scope Definition & Prioritization — 確認事項

上流成果物:
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`（intent-statement）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/feasibility-assessment.md`（feasibility-assessment）
- `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/feasibility/constraint-register.md`（constraint-register）

## すでに決まっていること（再確認はしません）

- 対象エリア: 福井を主対象、石川・富山も取得し画面上は区別（C-11）
- 公開ページは一般公開、RSS は認証付きで本人専用（C-12、C-13）
- 主催者名は表示しない（C-14）
- 技術スタック: TypeScript / Cloudflare（C-08）、費用は無料枠のみ（C-09）
- 期限は設けない（feasibility Q5=A）
- 成功指標: 福井のイベントを探すために収集元サイトを巡回する必要がなくなること

---

## Q1. 最初のバージョンに必ず入っていてほしい機能はどれですか？（複数選択可）

「これが揃えば、もう connpass を自分で見に行かなくて済む」と言える最小限を決めます。ここで選ばなかったものは後回しになります。

- A. 定期的にイベントを収集して保存する（これがないと何も始まらない）
- B. 公開ページで、これから開催されるイベントの一覧を見られる
- C. 一覧で福井・石川・富山を区別して見分けられる
- D. 認証付きの個人用 RSS で新着を受け取れる
- E. 収集が止まったことに自分で気づける（失敗の記録や通知）
- X. Other (please specify)

[Answer]:A, B, C, D

---

## Q2. 「あったら嬉しいが、最初はなくてよい」ものはどれですか？（複数選択可）

Q1 で選ばなかったもののうち、将来やりたいものを記録します。ここにも入らないものは「作らない」として記録します。

- A. キーワードでの検索
- B. 開催日・エリアでの絞り込みや並び替え
- C. 終了したイベントを遡って見られる（過去イベントの閲覧）
- D. connpass 以外の収集元の追加
- E. 特になし（Q1 で選んだもの以外は当面不要）
- X. Other (please specify)

[Answer]:D

---

## Q3. connpass の API 審査の結果が出るまで、どこまで進めますか？

feasibility で、API キーが未発行のため実データでの検証ができない状態（I-01）が記録されています。審査結果がいつ出るか分からないため、待ち方を決めておきます。

- A. 設計から実装まで進める。実データでの確認だけをキー発行後に回す
- B. 設計は進めるが、実装は着手しない
- C. ダミーデータで動く状態まで作り、キー発行後に本物に差し替える
- D. Not yet defined（判断できない／相談したい）
- X. Other (please specify)

[Answer]:A

---

## Q4. 一覧に表示するのは、どの期間のイベントですか？

収集したデータをどこまで見せるかで、保存する範囲も画面の作りも変わります。

- A. これから開催されるものだけ（終了したイベントは一覧に出さない）
- B. これから開催されるもの + 直近に終了したもの（1〜2週間程度）
- C. 収集したものはすべて見られる（過去も含めて全期間）
- D. Not yet defined（まだ決めていない）
- X. Other (please specify)

[Answer]:B

---

## Q5. 石川・富山を「区別して扱う」とは、具体的にどの状態ですか？

intent-capture で「福井を主対象とし、石川・富山も取得はするが画面上は区別して扱う」（C-11）と確定しています。その「区別」の見え方を決めます。

- A. 同じ一覧に混ぜて表示し、各イベントに県名を添える
- B. 福井を先に、石川・富山をその後にまとめて表示する
- C. 県ごとにページや区画を分ける
- D. 既定では福井だけを表示し、石川・富山は切り替えで見せる
- X. Other (please specify)

[Answer]:B

---

## Q6. イベントの詳細は、どこまで自分のサイトで見せますか？

connpass のデータをどこまで転載するかという判断でもあります。

- A. 一覧に最小限（タイトル・日時・場所）だけ出し、詳細は connpass へのリンクで飛ばす
- B. 一覧に加えて、説明文の冒頭など概要も自分のサイトに出す
- C. 取得した情報はできるだけ自分のサイトで見せる
- D. Not yet defined（判断できない／相談したい）
- X. Other (please specify)

[Answer]:A

---

## Q7. 作る順番の方針として、どれがいちばん近いですか？

- A. リスク先行 — 不確実なところ（connpass からの取得）を最初に通して、動くことを確かめてから広げる
- B. 価値先行 — 自分が一番欲しい機能から作る
- C. 依存順 — 収集 → 保存 → 表示と、素直に下から積み上げる
- D. おまかせ（提案してほしい）
- X. Other (please specify)

[Answer]:D

---

## Q8. 「これは作らない」と今の時点で決めておきたいものはありますか？（複数選択可）

範囲外を明記しておくと、後から迷わずに済みます。

- A. 利用者登録・ログイン機能（本人以外のアカウントは作らない）
- B. イベントへの申込み機能（connpass へ飛ばすだけにする）
- C. お気に入り・参加予定の管理
- D. 自分以外への通知（メール配信など）
- E. スマートフォンアプリ
- X. Other (please specify)

[Answer]:A, B, C, D, E

---

## Q9. 「収集が止まったことに気づける仕組み」は、結局どう扱いますか？

Q1 でも Q2 でも選ばれなかったため、現状の回答では「作らない」という整理になります。しかしこれは、すでに決まっている以下の2つと食い違います。

- intent-capture で「監視・通知の設定」を計画に追加することを選ばれ、実行ステップに `observability-setup` を戻した
- feasibility で、connpass の API 仕様変更リスク（R-03）の対応方針を「収集の失敗を検知できる仕組みを observability-setup で用意する」と記録した

定期取得は黙って止まるのが常で、止まったことに気づけないと「巡回しなくてよくなる」という成功指標そのものが崩れます。どう扱うか決めてください。

- A. 最初のバージョンに含める（Q1 に E を追加する）
- B. 最初のバージョンには入れないが、作る予定として残す（Q2 に追加する）
- C. 作らない。計画から `observability-setup` を外し、R-03 の対応方針も見直す
- D. Not yet defined（判断できない／相談したい）
- X. Other (please specify)

[Answer]:A どのようなものを入れるのかは後続で

---

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
