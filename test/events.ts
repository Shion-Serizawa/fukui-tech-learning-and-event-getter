import type { HokurikuEvent } from "../src/domain/event.ts";
import { HOUR, NOW } from "./fakes.ts";

/** D1 に直接入れるためのイベント（connpass の形を経由しない）。 */
export function hEvent(id: string, partial: Partial<HokurikuEvent> = {}): HokurikuEvent {
  return {
    source: "connpass",
    sourceEventId: id,
    title: `イベント ${id}`,
    url: `https://connpass.com/event/${id}/`,
    startedAt: NOW + 24 * HOUR,
    endedAt: NOW + 27 * HOUR,
    place: "福井市 ○○センター",
    address: "福井県福井市大手3丁目",
    capacity: 40,
    accepted: 25,
    hashTag: "fukuidev",
    prefecture: "fukui",
    ...partial,
  };
}
