-- 県ごとに「最後に取得・保存できた収集回の now」を持つ（COL-08, STO-05）。
-- 一覧と RSS は、イベントの last_seen_at がその県の synced_at と一致するものだけを出す。
-- スキーマ変更は追加のみ（既存の列・テーブルは変えない）。
CREATE TABLE prefecture_syncs (
  prefecture TEXT PRIMARY KEY CHECK (prefecture IN ('fukui', 'ishikawa', 'toyama')),
  synced_at INTEGER NOT NULL
);
