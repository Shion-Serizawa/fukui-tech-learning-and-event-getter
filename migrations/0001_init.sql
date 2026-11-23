-- 収集したイベント。主催者名（owner_nickname / owner_display_name）の列は持たない（C-14）。
-- 時刻はすべて UNIX エポックミリ秒（UTC）。
-- スキーマ変更は列の追加のみ（削除・改名はしない。team.md「ロールバック」）。
CREATE TABLE events (
  source TEXT NOT NULL CHECK (source IN ('connpass')),
  source_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  place TEXT,
  address TEXT,
  capacity INTEGER,
  accepted INTEGER NOT NULL,
  hash_tag TEXT,
  prefecture TEXT NOT NULL CHECK (prefecture IN ('fukui', 'ishikawa', 'toyama')),
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (source, source_event_id)
);

CREATE INDEX events_last_seen_at ON events (last_seen_at);

-- 収集の実行記録。最後に成功した収集の日時（S-05, D-25）の出どころ。
CREATE TABLE collection_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  finished_at INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  failure_kind TEXT CHECK (
    failure_kind IN (
      'http_error',
      'rate_limited',
      'network_error',
      'invalid_response',
      'too_many_pages',
      'storage_error'
    )
  ),
  fetched_count INTEGER NOT NULL,
  CHECK ((status = 'success') = (failure_kind IS NULL))
);

CREATE INDEX collection_runs_status_finished_at ON collection_runs (status, finished_at);

-- Discord への通知の送信済み記録（HLT-02, HLT-03）。同じ停止について2通目を送らないため。
CREATE TABLE notifications (
  key TEXT PRIMARY KEY,
  sent_at INTEGER NOT NULL
);
