import { PREFECTURE_LABEL, type StoredEvent } from "../domain/event.ts";
import { participantsLabel, placeLabel } from "../domain/format.ts";
import { SITE_DESCRIPTION, SITE_TITLE } from "../domain/site.ts";
import { formatEventPeriod, formatRfc822 } from "../domain/time.ts";
import { type Markup, toText, xml } from "../markup/markup.ts";

function item(event: StoredEvent): Markup {
  const description = [formatEventPeriod(event.startedAt, event.endedAt), placeLabel(event), participantsLabel(event)]
    .filter((part): part is string => part !== null)
    .join(" / ");
  return xml`<item><title>[${PREFECTURE_LABEL[event.prefecture]}] ${event.title}</title><link>${event.url}</link><guid isPermaLink="false">connpass:${event.sourceEventId}</guid><pubDate>${formatRfc822(event.firstSeenAt)}</pubDate><description>${description}</description></item>`;
}

/** RSS-03〜RSS-08: events は selectFeedEvents で選び、並べ済みのもの。siteUrl は公開ページの origin。 */
export function renderFeed(input: {
  readonly events: readonly StoredEvent[];
  readonly now: number;
  readonly siteUrl: string;
}): string {
  const doc = xml`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>${SITE_TITLE}</title><link>${input.siteUrl}</link><description>${SITE_DESCRIPTION}</description><language>ja</language><lastBuildDate>${formatRfc822(input.now)}</lastBuildDate>${input.events.map(item)}</channel></rss>
`;
  return toText(doc);
}
