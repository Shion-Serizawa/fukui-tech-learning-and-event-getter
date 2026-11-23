# 北陸ITイベント

connpass API から北陸3県のオフライン IT イベントを毎時集め、公開ページ・RSS で見せ、収集が止まったら Discord に通知する。Cloudflare（Worker + D1 + Pages）、TypeScript。

## 正はどこにあるか

- **仕様**: [docs/spec/](docs/spec/README.md)。要件 ID（`COL-nn` など）と合否の判定条件は [03-behavior.md](docs/spec/03-behavior.md)
- **規則**: 型・lint・テストに落としてある。対応表は [05-architecture.md「規則と強制手段」](docs/spec/05-architecture.md#規則と強制手段)
- `aidlc/` はアーカイブ。経緯を知りたいときだけ読む

## 作業の流れ

```sh
npm run check   # 型・lint・整形・テスト（カバレッジ 80%）・仕様との対応。終わる前に必ず通す
npm run fmt     # 整形
npm run spec:check   # どの要件にまだテストがないか
```

- 要件を実装したら、同じ変更でテストを書き、`describe` / `it` の名前に要件 ID を入れる
- 仕様を変えるときは先に `docs/spec/` を変える
- lint に止められたら、メッセージに書かれた理由に従ってコードを直す。**抑制コメントは使えない**。ルールが間違っていると思ったら、そう報告する
- 同じ誤りを繰り返さないための手段は、この文書に1行足すことではなく、lint ルール（`tools/lint/`）・型・テストを足すこと

## してはいけないこと（機械では止めきれないもの）

- connpass の実レスポンスや、それを加工したものをリポジトリに置かない（主催者名が公開リポジトリの履歴に残る）。フィクスチャは手で書く
- 自動テストや開発中のループで connpass API を繰り返し叩かない（レート制限 1秒1リクエスト、キーは1つしかない）
- シークレットの値（`.dev.vars` の中身、Webhook URL、API キー）を、ファイル・コミット・ログ・会話に書かない
