import { html, toText } from "../../src/markup/markup.ts";

/**
 * Pages Functions のエントリポイント（W-01 公開イベント一覧）。
 * 現在時刻と env を読んでよいのはここだけ。描画は src/web/ の純粋関数に任せる。
 */
export const onRequestGet: PagesFunction<Env> = () => {
  // TODO(WEB-*): 一覧（docs/spec/03-behavior.md）を実装するまでは骨組みだけを返す。
  const page = html`<!doctype html>
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>北陸ITイベント</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <header><h1>北陸ITイベント</h1></header>
        <main><p>準備中です。</p></main>
      </body>
    </html>`;
  return new Response(toText(page), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};
