/**
 * WEB-15: Functions が返す応答に付けるセキュリティヘッダ。
 * web/public/_headers は静的ファイルにしか効かない（Pages Functions の応答には適用されない）ため、
 * 一覧と RSS の応答にはここから付ける。値は _headers と同じに保つ（test/pages.test.ts が両者の一致を検査する）。
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

export function withSecurityHeaders(headers: Readonly<Record<string, string>>): Record<string, string> {
  return { ...headers, ...SECURITY_HEADERS };
}
