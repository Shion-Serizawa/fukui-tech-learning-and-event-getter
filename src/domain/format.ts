import type { HokurikuEvent } from "./event.ts";

/** WEB-05: place、なければ address、両方なければ null。 */
export function placeLabel(event: HokurikuEvent): string | null {
  return event.place ?? event.address;
}

/** WEB-06 */
export function participantsLabel(event: HokurikuEvent): string {
  return event.capacity === null ? `${event.accepted} 人` : `${event.accepted} / ${event.capacity} 人`;
}
