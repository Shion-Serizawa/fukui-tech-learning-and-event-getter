export const PREFECTURES = ["fukui", "ishikawa", "toyama"] as const;
export type Prefecture = (typeof PREFECTURES)[number];

export const PREFECTURE_LABEL: Readonly<Record<Prefecture, string>> = {
  fukui: "福井",
  ishikawa: "石川",
  toyama: "富山",
};

/** 収集元から取得し、検証と変換を済ませたイベント。connpass の DTO はここに出てこない。 */
export interface HokurikuEvent {
  readonly source: "connpass";
  readonly sourceEventId: string;
  readonly title: string;
  readonly url: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly place: string | null;
  readonly address: string | null;
  readonly capacity: number | null;
  readonly accepted: number;
  readonly hashTag: string | null;
  readonly prefecture: Prefecture;
}

export interface StoredEvent extends HokurikuEvent {
  readonly firstSeenAt: number;
  readonly lastSeenAt: number;
}

export const FAILURE_KINDS = [
  "http_error",
  "rate_limited",
  "network_error",
  "invalid_response",
  "too_many_pages",
  "storage_error",
] as const;
export type FailureKind = (typeof FAILURE_KINDS)[number];

export type CollectionRun =
  | {
      readonly status: "success";
      readonly startedAt: number;
      readonly finishedAt: number;
      readonly fetchedCount: number;
    }
  | {
      readonly status: "failure";
      readonly startedAt: number;
      readonly finishedAt: number;
      readonly fetchedCount: number;
      readonly failureKind: FailureKind;
    };
