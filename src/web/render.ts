import { PREFECTURE_LABEL, type StoredEvent } from "../domain/event.ts";
import { participantsLabel, placeLabel } from "../domain/format.ts";
import type { Listing } from "../domain/listing.ts";
import { SITE_DESCRIPTION, SITE_TITLE } from "../domain/site.ts";
import { formatEventPeriod, formatJstMinute } from "../domain/time.ts";
import { type Markup, html, toText } from "../markup/markup.ts";

export const EMPTY_MESSAGE = "該当する期間に開催されるイベントはありません。";
export const FUKUI_EMPTY_MESSAGE = "現在、福井で開催予定のイベントはありません。";
export const ERROR_MESSAGE = "現在イベントを表示できません";

export type PageView =
  | { readonly kind: "error" }
  | { readonly kind: "ok"; readonly listing: Listing; readonly lastSuccessFinishedAt: number | null };

function card(event: StoredEvent, ended: boolean): Markup {
  const place = placeLabel(event);
  return html`<article class="event${ended ? " event--ended" : ""}">
<h3><a href="${event.url}">${event.title}</a></h3>
<p class="event__when">${formatEventPeriod(event.startedAt, event.endedAt)}${ended ? html` <span class="tag tag--ended">終了</span>` : null}</p>
${place === null ? null : html`<p class="event__where">${place}</p>`}
<p class="event__meta"><span class="tag tag--pref">${PREFECTURE_LABEL[event.prefecture]}</span> <span>${participantsLabel(event)}</span>${event.hashTag === null ? null : html` <span>#${event.hashTag}</span>`}</p>
</article>`;
}

function section(heading: string, body: Markup | readonly Markup[]): Markup {
  return html`<section>
<h2>${heading}</h2>
${body}
</section>`;
}

/** WEB-08: 空・端の状態を含む本文。 */
function mainContent(listing: Listing): Markup {
  const upcomingCount = listing.fukui.length + listing.ishikawaToyama.length;
  if (upcomingCount === 0 && listing.ended.length === 0) return html`<p>${EMPTY_MESSAGE}</p>`;

  const parts: Markup[] = [];
  if (upcomingCount > 0) {
    parts.push(
      section(
        "福井",
        listing.fukui.length > 0 ? listing.fukui.map((e) => card(e, false)) : html`<p>${FUKUI_EMPTY_MESSAGE}</p>`,
      ),
    );
    if (listing.ishikawaToyama.length > 0) {
      parts.push(
        section(
          "石川・富山",
          listing.ishikawaToyama.map((e) => card(e, false)),
        ),
      );
    }
  }
  if (listing.ended.length > 0)
    parts.push(
      section(
        "終了したイベント",
        listing.ended.map((e) => card(e, true)),
      ),
    );
  return html`${parts}`;
}

function footer(lastSuccessFinishedAt: number | null | undefined): Markup {
  const collected =
    lastSuccessFinishedAt === undefined
      ? null
      : html`<p>最終収集: ${lastSuccessFinishedAt === null ? "まだありません" : formatJstMinute(lastSuccessFinishedAt)}</p>`;
  return html`<footer>
${collected}
<p>イベント情報の提供元: <a href="https://connpass.com/">connpass</a> ・ <a href="/feed.xml">RSS</a></p>
</footer>`;
}

/** WEB-01〜WEB-13: 公開一覧の HTML。エラー状態では最終収集日時を出さない（WEB-11）。 */
export function renderPage(view: PageView): string {
  const main = view.kind === "error" ? html`<p>${ERROR_MESSAGE}</p>` : mainContent(view.listing);
  const page = html`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${SITE_TITLE}</title>
<meta name="description" content="${SITE_DESCRIPTION}">
<link rel="stylesheet" href="/style.css">
<link rel="alternate" type="application/rss+xml" title="${SITE_TITLE}" href="/feed.xml">
</head>
<body>
<header>
<h1>${SITE_TITLE}</h1>
<p>${SITE_DESCRIPTION}</p>
</header>
<main>
${main}
</main>
${footer(view.kind === "error" ? undefined : view.lastSuccessFinishedAt)}
</body>
</html>
`;
  return toText(page);
}
