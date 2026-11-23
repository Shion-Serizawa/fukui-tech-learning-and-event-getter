import { describe, expect, it } from "vitest";
import { isValidWebhookUrl } from "./discord.ts";

describe("HLT-05: Discord の Webhook URL の検証", () => {
  it.each(["https://discord.com/api/webhooks/123/abc-DEF_0"])("通す: %s", (url) => {
    expect(isValidWebhookUrl(url)).toBe(true);
  });

  it.each([
    "http://discord.com/api/webhooks/123/abc",
    "https://discord.com.evil.example/api/webhooks/123/abc",
    "https://evil.example/?https://discord.com/api/webhooks/1/x",
    "https://user:pw@discord.com/api/webhooks/123/abc",
    "https://discord.com/api/channels/123",
    "not a url",
  ])("拒否: %s", (url) => {
    expect(isValidWebhookUrl(url)).toBe(false);
  });
});
