# 04. データ

## 時刻

| 項目               | 決め                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 保存               | UNIX エポックミリ秒（UTC）の整数。D1 の `INTEGER`                                                                                    |
| 表示               | 日本時間（UTC+9 固定。夏時間はない）                                                                                                 |
| 「月」「日」の境界 | JST の暦で判定する（COL-03 の `ym`、WEB-04 の日付）                                                                                  |
| 現在時刻           | ハンドラの境界で1度だけ取得し、引数 `now`（エポックミリ秒）で渡す。ロジックの中で時計を読まない（lint: `hokuriku/no-ambient-clock`） |

## connpass API の境界

**2026-11-23 に実レスポンス（福井・7か月分）と突き合わせた（V-01）。** サードパーティの資料（[S6]）では URL のフィールド名が `event_url` だったが、実際は `url` だった。`limit` と `image_url` は null を取りうる。推定が外れていたときに「黙って壊れる」のではなく「失敗として記録される」よう、変換点で実行時に検証する（COL-11）。

### リクエスト

| 項目         | 値                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| URL          | `https://connpass.com/api/v2/events/`                                                                       |
| 認証         | ヘッダ `X-API-Key: <CONNPASS_API_KEY>`。あわせて `User-Agent` を必ず付ける（ないと 403。2026-11-24 に確認） |
| `prefecture` | `fukui` / `ishikawa` / `toyama` のいずれか1つ（COL-02）                                                     |
| `ym`         | `YYYYMM` をカンマ区切りで7つ（COL-03）                                                                      |
| `count`      | `100`                                                                                                       |
| `start`      | `1` 始まり（COL-04）                                                                                        |
| `order`      | `2`（開催日時順）。順序には依存しない（全ページを取るため）                                                 |

### レスポンスから使うフィールド（allowlist）

使うのはこの表のフィールドだけ。変換は**明示列挙**で書き、レスポンスをスプレッドしたりそのまま保存したりしない（project.md Mandated）。主催者に関するフィールド（`owner_*`）は読まない。

トップレベル:

| フィールド          | 型       | 必須 | 用途                                      |
| ------------------- | -------- | ---- | ----------------------------------------- |
| `results_returned`  | 整数 ≥ 0 | 必須 | ページングの終了判定                      |
| `results_available` | 整数 ≥ 0 | 必須 | ページングの終了判定                      |
| `results_start`     | 整数 ≥ 1 | 必須 | 検証のみ（送った `start` と一致すること） |
| `events`            | 配列     | 必須 | —                                         |

`events[]` の各要素:

| フィールド    | 型                                                              | 必須 | 変換先                                                                                                         |
| ------------- | --------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------- |
| `id`          | 整数                                                            | 必須 | `sourceEventId`（10進の文字列にする）                                                                          |
| `title`       | 空でない文字列                                                  | 必須 | `title`                                                                                                        |
| `url`         | `https:` で、ホストが `connpass.com` か `*.connpass.com` の URL | 必須 | `url`。**`javascript:` などのリンクを公開ページと RSS に出さないための検証でもある**（エスケープでは防げない） |
| `started_at`  | ISO 8601（タイムゾーン付き）                                    | 必須 | `startedAt`                                                                                                    |
| `ended_at`    | ISO 8601（タイムゾーン付き）。`started_at` 以上                 | 必須 | `endedAt`                                                                                                      |
| `place`       | 文字列または null                                               | 任意 | `place`（空文字は null）                                                                                       |
| `address`     | 文字列または null                                               | 任意 | `address`（空文字は null）                                                                                     |
| `limit`       | 整数 ≥ 0 または null                                            | 任意 | `capacity`（0 と null は「定員なし」として null）                                                              |
| `accepted`    | 整数 ≥ 0                                                        | 必須 | `accepted`                                                                                                     |
| `hash_tag`    | 文字列または null                                               | 任意 | `hashTag`（空文字は null。先頭の `#` は取り除く）                                                              |
| `open_status` | 文字列または null                                               | 任意 | 保存しない。`cancelled` のイベントは取得しなかったものとして扱う（COL-13）                                     |

`hash_tag` は空文字を取りうる。`place` / `address` は今回の実データでは常に値があったが、空文字と null の両方を受ける。

「必須」が欠けている、型が違う、`url` が connpass でない、`ended_at < started_at` — のいずれかなら、その収集回を `invalid_response` で失敗させる（COL-11）。

「任意」のフィールドがレスポンスに**存在しない**ことは許す（null として扱う）。必須・任意の区分は V-01（2026-11-23）で実データと突き合わせ、このままとした。

### フィクスチャ

- 手で書く。**実レスポンスをコミットしない**（公開リポジトリに主催者名が恒久的に残るため。project.md Forbidden）
- 置き場所は `src/connpass/fixtures/` だけ。主催者名のフィールドを含めてよいのはここだけ（lint: `hokuriku/no-organizer-fields`）。含めるのは「変換で捨てられること」を確かめるため
- 主催者名の値には、実在しない明らかな作り物を使う（例: `fixture-owner-should-not-appear`）

## ドメインの型（`src/domain/`）

Worker と Pages の両方が使う型は `src/domain/` にだけ置く（project.md Mandated）。connpass の DTO はここに置かない。

```ts
export const PREFECTURES = ["fukui", "ishikawa", "toyama"] as const;
export type Prefecture = (typeof PREFECTURES)[number];

export interface HokurikuEvent {
  readonly source: "connpass";
  readonly sourceEventId: string;
  readonly title: string;
  readonly url: string;
  readonly startedAt: number; // エポックミリ秒
  readonly endedAt: number;
  readonly place: string | null;
  readonly address: string | null;
  readonly capacity: number | null;
  readonly accepted: number;
  readonly hashTag: string | null; // 先頭の # なし
  readonly prefecture: Prefecture;
}

export interface StoredEvent extends HokurikuEvent {
  readonly firstSeenAt: number;
  readonly lastSeenAt: number;
}

export type FailureKind =
  | "http_error"
  | "rate_limited"
  | "network_error"
  | "invalid_response"
  | "too_many_pages"
  | "storage_error";

export type CollectionRun =
  | { readonly status: "success"; readonly startedAt: number; readonly finishedAt: number; readonly fetchedCount: number }
  | {
      readonly status: "failure";
      readonly startedAt: number;
      readonly finishedAt: number;
      readonly fetchedCount: number;
      readonly failureKind: FailureKind;
    };
```

県の表示名: `fukui` → 福井、`ishikawa` → 石川、`toyama` → 富山。

snake_case の識別子は2つの変換点（connpass DTO → ドメイン型、ドメイン型 → D1 の行）の内側にだけ置く（team.md「Code Style」）。

## D1 のスキーマ

正は `migrations/`。ここには意味だけを書く。

### `events`

| 列                       | 型           | 意味                                       |
| ------------------------ | ------------ | ------------------------------------------ |
| `source`                 | TEXT         | 収集元。今は `connpass` のみ（CHECK 制約） |
| `source_event_id`        | TEXT         | 収集元でのイベント ID                      |
| `title`, `url`           | TEXT         | —                                          |
| `started_at`, `ended_at` | INTEGER      | エポックミリ秒                             |
| `place`, `address`       | TEXT NULL    | —                                          |
| `capacity`               | INTEGER NULL | 定員。なしは NULL                          |
| `accepted`               | INTEGER      | 参加者数                                   |
| `hash_tag`               | TEXT NULL    | 先頭の `#` なし                            |
| `prefecture`             | TEXT         | fukui / ishikawa / toyama（CHECK 制約）    |
| `first_seen_at`          | INTEGER      | 初めて保存した収集回の now（STO-03）       |
| `last_seen_at`           | INTEGER      | 最後に取得できた成功回の now（STO-04）     |

主キーは `(source, source_event_id)`。主催者に関する列は持たない（STO-07）。

### `collection_runs`

| 列                          | 型        | 意味                                                       |
| --------------------------- | --------- | ---------------------------------------------------------- |
| `id`                        | INTEGER   | 自動採番                                                   |
| `started_at`, `finished_at` | INTEGER   | 収集回の開始（= now）と終了                                |
| `status`                    | TEXT      | `success` / `failure`                                      |
| `failure_kind`              | TEXT NULL | 失敗の種別。成功回は NULL、失敗回は必須（CHECK 制約）      |
| `fetched_count`             | INTEGER   | その回で取得したイベント数（失敗回は失敗までに取得した数） |

### `prefecture_syncs`

県ごとに「最後に取得・保存できた収集回の now」を持つ（COL-08、STO-05）。一覧と RSS は、イベントの `last_seen_at` がその県の `synced_at` と一致するものだけを出す。

| 列           | 型             | 意味                                                                             |
| ------------ | -------------- | -------------------------------------------------------------------------------- |
| `prefecture` | TEXT（主キー） | fukui / ishikawa / toyama（CHECK 制約）                                          |
| `synced_at`  | INTEGER        | その県を最後に取得・保存できた収集回の now。イベントの保存と同じバッチで更新する |

### `notifications`

Discord への通知の送信済み記録（HLT-02, HLT-03）。同じ停止について2通目を送らないために使う。

| 列        | 型             | 意味                                                                     |
| --------- | -------------- | ------------------------------------------------------------------------ |
| `key`     | TEXT（主キー） | `stale:{最新の成功回の finished_at または never}` / `recovered:{同じ値}` |
| `sent_at` | INTEGER        | 送信できた時刻                                                           |

送信に成功してから行を入れる（HLT-04）。30日より古い行は STO-06 と同じタイミングで消す。

### スキーマを変えるとき

- **列の追加のみ**。削除・改名は別の変更に分ける（コードを戻してもデータが壊れない形を保つ）
- マイグレーションはテスト起動時に毎回適用される（`test/apply-migrations.ts`）。適用できること自体が毎回検証される
- 列を足したら `src/db/schema.test.ts` の期待する列の一覧も更新する（STO-07）
