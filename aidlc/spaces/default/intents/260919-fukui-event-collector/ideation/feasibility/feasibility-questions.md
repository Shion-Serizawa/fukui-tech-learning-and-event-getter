# Feasibility & Constraints — 確認事項

上流成果物: `aidlc/spaces/default/intents/260919-fukui-event-collector/ideation/intent-capture/intent-statement.md`（intent-statement）

## 事前調査でわかったこと（質問の前提）

以下は公開情報を確認した結果です。出典は `## Sources` に記載しています。

1. **connpass はスクレイピングを禁止している。** 2024年9月1日より利用規約に明記され、第7条第1項第17号で「当社から提供されるAPI以外の方法（自動化した方法であるか否かを問いません。）によって、当サイトへクローリング、スクレイピング、その他のアクセスを行いもしくは行うよう試みる行為」が禁止事項とされている [S1][S2]。したがって**取得手段は公式APIの一択**であり、当初のご依頼にあった「スクレイピングなどして収集する」という方式は connpass に対しては取れない。
2. **API の利用には申請と審査が必要。** 個人・コミュニティ向けは無償だが、申請フォームから利用目的を申請し、審査の上で APIキーが1つだけ発行される。発行までおおむね1週間程度かかるとの報告がある [S3][S4]。
3. **レート制限は APIキーあたり 1秒1リクエスト**との報告がある。超過すると HTTP 429 が返る [S4]。（公式ヘルプは「一定時間内での連続アクセス回数に制限あり」とのみ記載 [S3]）
4. **都道府県での絞り込みは API が標準でサポートしている。** イベント検索 API の `prefecture` パラメータに全47都道府県の英字名と `online` を指定できる [S5][S6]。福井・石川・富山の指定が可能で、`online` を指定しなければオンライン専用イベントは含まれない。
5. **レスポンスに「オンライン/オフライン」を直接示すフィールドはない** [S6]。`event_type` は `participation` / `advertisement` の区別であり、開催形式ではない。開催地の判定に使えるのは `address` / `place` / `lat` / `lon` と、検索時の `prefecture` 指定である。

---

## Q1. connpass の API 利用申請を出しますか？

上記1・2のとおり、API 以外の取得手段は規約で塞がれています。申請を出さない限り、このプロジェクトは connpass からデータを取得できません。

- A. 申請を出す。審査結果が出るまでの間は、API が使える前提で設計だけ進める
- B. 申請を出す。審査が通るまで実装には着手しない（待ち時間が発生する）
- C. 申請は出さず、connpass 以外の収集元を主対象に変更する
- D. Not yet defined（判断できない／相談したい）
- X. Other (please specify)

[Answer]:A（申請自体はだしたので、返信待ち）

---

## Q2. 収集したイベント情報を公開サイトと RSS で再配信することについて、どう扱いますか？

intent-statement では「サイトとして公開し、RSS も出す」ことが確定しています。一方 connpass の API 利用規約には、禁止事項として「競合サービスの提供」が含まれます。connpass のイベント情報を集約して公開するサイトが、これに該当すると判断される可能性は否定できません（該当するかどうかの明確な線引きは規約上示されていません）[S7]。また API 利用申請では利用目的を申告するため、申請時点でこの点が審査対象になります。

- A. 申請時に「北陸のイベント情報を集約して公開する」と正直に目的を書き、審査結果に従う
- B. まず自分専用（非公開）として申請し、公開は審査が通ってから別途相談する
- C. 公開はやめて自分専用のツールにする（intent-statement の範囲を狭める）
- D. Not yet defined（判断できない／相談したい）
- X. Other (please specify)

[Answer]:RSSだけ個人にしようかな。（書き忘れた） 公開ページは書いたので普通にだす。

---

## Q3. 「オフライン開催」の判定方法は、以下でよいですか？

上記4・5のとおり、レスポンスに開催形式のフィールドがないため、判定は検索時の `prefecture` 指定に依存します。福井・石川・富山を指定して取得すれば、オンライン専用として登録されたイベントは含まれません。ただし主催者が都道府県を正しく設定していない場合や、ハイブリッド開催の扱いは、この方法では判別できません。

- A. `prefecture` 指定での判定でよい。取りこぼしや誤判定は許容する
- B. `prefecture` 指定に加えて、`address` / `place` の内容も見て補正したい
- C. ハイブリッド開催も含めて拾いたいので、`online` も併せて取得して後で仕分けたい
- D. Not yet defined（まだ決めていない）
- X. Other (please specify)

[Answer]:A

---

## Q4. 技術スタックについて、現時点の想定を教えてください。

intent-statement では公開先として Cloudflare を想定していると記録されています。実装言語や構成の前提があれば確定させます。

- A. TypeScript / Cloudflare Workers + D1（または KV）で完結させたい
- B. TypeScript だが、データベースは Cloudflare 以外（外部の managed DB）も検討したい
- C. 言語・構成にこだわりはない。提案してほしい
- D. Cloudflare 以外も含めて検討し直したい
- X. Other (please specify)

[Answer]:A（バッチ（cron）とpage、バックエンドが必要になりそう。D1にAPIのデータを保存するので）

---

## Q5. 予算と期限の制約はありますか？

- A. どちらもなし。無料枠の範囲で動けばよく、期限も設けない
- B. 費用は無料枠のみ。期限は設けないが、なるべく早く動くものが欲しい
- C. 多少の費用（月数百円〜千円程度）は許容する。期限はなし
- D. 期限がある（補足に記載）
- X. Other (please specify)

[Answer]:A

---

## Q6. 既存のシステムやサービスと連携する必要はありますか？

- A. なし（None — 単独で完結する）
- B. 通知先として既存のサービスに繋ぎたい（Slack / Discord / メールなど、補足に記載）
- C. 既存の自分のサイト・ドメインに組み込みたい
- D. Not yet defined（まだ決めていない）
- X. Other (please specify)

[Answer]:A（RSS機能でdiscordにつなぐかもぐらい）

---

## Q7. 個人情報や規制対応について、考慮すべきことはありますか？

収集対象はイベントの公開情報ですが、connpass のレスポンスには主催者のニックネーム・表示名（`owner_nickname` / `owner_display_name`）が含まれます [S6]。また API 利用規約第9条第1項は、利用者情報を同意した目的以外で利用すること、第三者に譲渡・販売することを禁じています [S7]。

- A. 主催者名は表示せず、イベント情報のみを扱う
- B. 主催者名は表示する（connpass 上で公開されている情報であるため）
- C. Not yet defined（判断できない／相談したい）
- X. Other (please specify)

[Answer]:A

---

## Q8. 組織的な制約（着手を妨げるもの）はありますか？

- A. なし（None — 個人プロジェクトとして自由に進められる）
- B. 業務時間外のみ作業するため、進行速度に制約がある
- C. 所属先の副業規定・情報公開規定を確認する必要がある
- D. Not yet defined
- X. Other (please specify)

[Answer]:A

---

## Sources

- [S1] connpass 利用規約 第7条第1項第17号 — https://connpass.com/term/
- [S2] connpass 公式アナウンス（2024年9月1日よりスクレイピングを禁止し利用規約に明記）— https://x.com/connpass_jp/status/1830480652430627088
- [S3] connpass API の利用について（公式ヘルプ）— https://help.connpass.com/api/
- [S4] connpass API v2 のレート制限・APIキー発行に関する利用報告 — https://zenn.dev/esusaki/articles/2b03fcbec86b1e 、https://qiita.com/kitazaki/items/80ca996089b979102b4e
- [S5] connpass API v2 リファレンス — https://connpass.com/about/api/v2/
- [S6] connpass API v2 クライアント実装のモデル定義（GetEventsQuery / ConnpassEvent のフィールド一覧）— https://pkg.go.dev/github.com/ryohidaka/go-connpass/models
- [S7] connpass API 利用規約 — https://help.connpass.com/api/api-term

---

## Q9. 「RSS だけ個人にする」というのは、具体的にどの状態を指しますか？

Q2 の回答で RSS は個人用にするとのことでしたが、intent-capture では「サイトとして公開し、RSS も出す」ことが確定していました。RSS の公開範囲が変わると、成果物に記録した範囲を狭める必要があるため、どの状態かを確定させてください。

- A. RSS は作るが、URL を公開しない（知っている人だけがアクセスできる。認証はかけない）
- B. RSS は作り、トークンや認証で自分だけがアクセスできるようにする
- C. RSS は当面作らない。公開ページだけ作り、RSS は後から判断する
- D. RSS も普通に公開する（Q2 の回答を撤回する）
- X. Other (please specify)

[Answer]:RSSに認証機能をつけることが技術的に可能ならやる。無理なら、個人のdiscordにながすbotを作る形に差し替える

---

## Q10. すでに出された API 利用申請には、公開ページを作ることを書いていますか？

Q1 の回答で申請済みとのことでした。「公開ページは書いた」と読めますが、申告した利用目的に公開ページが含まれているかどうかで、審査が通ったあとに公開してよいかが変わります。含まれていない場合、公開前に connpass へ改めて確認する必要が生じます。

- A. 含まれている。公開ページを作る旨を申請時に書いた
- B. 含まれていない。自分用ツールとしてのみ申請した
- C. 覚えていない／申請内容を確認する必要がある
- X. Other (please specify)

[Answer]:A

---

## Consolidated Summary Confirmation

- Looks correct
- Request changes

[Answer]: Looks correct
