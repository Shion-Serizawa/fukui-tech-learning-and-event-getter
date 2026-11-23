import { describe, expect, it } from "vitest";
import { escapeText, html, toText, xml } from "./markup.ts";

describe("RSS-07: markup による第三者由来の文字列のエスケープ（C-12）", () => {
  it("埋め込んだ文字列の & < > \" ' をエスケープする", () => {
    const title = `A & B <script>alert("x")</script> 'q'`;
    expect(toText(html`<h3>${title}</h3>`)).toBe(
      "<h3>A &amp; B &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &#39;q&#39;</h3>",
    );
  });

  it("]]> を含むタイトルでも XML として壊れない（CDATA を使わない）", () => {
    expect(toText(xml`<title>${"a ]]> b"}</title>`)).toBe("<title>a ]]&gt; b</title>");
  });

  it("XML 1.0 で使えない制御文字を落とし、改行とタブは残す", () => {
    expect(escapeText("a\u0000b\u0008c\u000Bd\te\nf\r￿")).toBe("abcd\te\nf\r");
  });

  it("Markup は二重にエスケープしない。配列は連結し、null と undefined は空にする", () => {
    const items = ["<a>", "<b>"].map((t) => html`<li>${t}</li>`);
    const list = html`<ul>${items}${null}${undefined}</ul>`;
    expect(toText(list)).toBe("<ul><li>&lt;a&gt;</li><li>&lt;b&gt;</li></ul>");
  });

  it("数値は文字列として埋め込む", () => {
    expect(toText(html`<span>${25} / ${40}</span>`)).toBe("<span>25 / 40</span>");
  });
});
