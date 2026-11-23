const MARKUP = Symbol("markup");

/** エスケープ済みの HTML / XML 断片。html`` / xml`` タグからしか作れない。 */
export interface Markup {
  readonly [MARKUP]: string;
}

export type Interpolation = Markup | string | number | null | undefined | readonly Interpolation[];

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// XML 1.0 で使えない文字。第三者由来のタイトルに混入するとフィード全体が壊れるため落とす。
function isValidXmlChar(code: number): boolean {
  if (code === 0x09 || code === 0x0a || code === 0x0d) return true;
  if (code < 0x20) return false;
  return code !== 0xfffe && code !== 0xffff;
}

export function escapeText(value: string): string {
  let out = "";
  for (const ch of value) {
    if (!isValidXmlChar(ch.codePointAt(0) ?? 0)) continue;
    out += ENTITIES[ch] ?? ch;
  }
  return out;
}

function isMarkup(value: Interpolation): value is Markup {
  return typeof value === "object" && value !== null && MARKUP in value;
}

function serialize(value: Interpolation): string {
  if (value === null || value === undefined) return "";
  if (isMarkup(value)) return value[MARKUP];
  if (Array.isArray(value)) return value.map(serialize).join("");
  if (typeof value === "number") return escapeText(String(value));
  if (typeof value === "string") return escapeText(value);
  return "";
}

/** 埋め込んだ値をすべてエスケープするテンプレートタグ。Markup はそのまま入る。 */
export function html(strings: TemplateStringsArray, ...values: readonly Interpolation[]): Markup {
  let out = strings[0] ?? "";
  values.forEach((value, i) => {
    out += serialize(value) + (strings[i + 1] ?? "");
  });
  return { [MARKUP]: out };
}

/** RSS 用。エスケープ規則は html と同じ（CDATA は使わない）。 */
export const xml = html;

export function toText(markup: Markup): string {
  return markup[MARKUP];
}
