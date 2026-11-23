# アーカイブ（2026-11-23）

この配下は AI-DLC で IDEATION 〜 practices-discovery まで進めた成果物である。以後は更新しない。

作るものの正は `docs/spec/` に移した。`memory/project.md` の Mandated / Forbidden は、lint・型・テスト・設定に落とし、
対応を `docs/spec/05-architecture.md「規則と強制手段」` にまとめてある。

移行時に変更した決定:
- RSS を認証なしで公開する（C-13 / D-17 / D-18 / D-32 を廃止）。API 利用申請との整合は未確認（docs/spec/01-product.md の R-07）
- 収集停止の通知を Discord Webhook にする（S-05 / D-42 の具体化）
- API キーは発行済み（C-02 / R-01 は解消）
