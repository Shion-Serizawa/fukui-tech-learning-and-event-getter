import type { Fetcher, TimeoutSignal } from "../domain/io.ts";
import { logError, logInfo } from "../log.ts";

export const DISCORD_WEBHOOK_PREFIX = "https://discord.com/api/webhooks/";
const TIMEOUT_MS = 10_000;
/** Discord の content の上限は 2000 文字。余裕を持たせる。 */
const MAX_CONTENT_LENGTH = 1900;

export interface DiscordDeps {
  readonly fetch: Fetcher;
  readonly timeoutSignal: TimeoutSignal;
  /** Worker のシークレット DISCORD_WEBHOOK_URL。URL 自体が投稿の権限なので、ログに出さない。 */
  readonly webhookUrl: string | undefined;
}

/** HLT-05: https://discord.com/api/webhooks/ で始まる URL だけを送り先として認める。 */
export function isValidWebhookUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.href.startsWith(DISCORD_WEBHOOK_PREFIX) &&
    url.hostname === "discord.com" &&
    url.username === "" &&
    url.password === ""
  );
}

/**
 * Discord に1通送る。送れたら true。失敗はログに残して false を返す（HLT-04。例外は投げない）。
 * メンションは一切解釈させない（allowed_mentions.parse = []）。
 */
export async function postToDiscord(deps: DiscordDeps, content: string): Promise<boolean> {
  if (deps.webhookUrl === undefined || deps.webhookUrl === "") {
    logInfo("notify.skipped", { kind: "webhook_not_configured" });
    return false;
  }
  if (!isValidWebhookUrl(deps.webhookUrl)) {
    logError("notify.failed", { kind: "invalid_webhook_url" });
    return false;
  }
  try {
    const res = await deps.fetch(deps.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, MAX_CONTENT_LENGTH), allowed_mentions: { parse: [] } }),
      signal: deps.timeoutSignal(TIMEOUT_MS),
    });
    await res.body?.cancel();
    if (!res.ok) {
      logError("notify.failed", { status: res.status, kind: "http_error" });
      return false;
    }
    logInfo("notify.sent", { status: res.status });
    return true;
  } catch {
    logError("notify.failed", { kind: "network_error" });
    return false;
  }
}
