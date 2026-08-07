/**
 * Conversion between the database chapter content format (text[] — one
 * paragraph per array element, each element either plain text or inline
 * HTML) and the rich text editor format (a single HTML string with
 * <p>/<h2>/<h3> block elements).
 *
 * Database schema is NOT changed: content stays text[].
 */

/** Tags treated as block-level boundaries when splitting editor HTML. */
const BLOCK_TAGS = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "DIV", "BLOCKQUOTE"];

/**
 * Convert a database paragraph array into a single HTML string for the
 * editor. Each element becomes one block element. Plain-text paragraphs
 * (no HTML tags) are wrapped in <p>; HTML paragraphs are kept as-is.
 */
export function paragraphsToEditorHtml(paragraphs: string[]): string {
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "<p><br></p>";
      if (/^<(p|h[1-6]|div|blockquote|li)\b/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("");
}

/**
 * Convert the editor's HTML output back into a text[] paragraph array.
 * Each top-level block element becomes one array element. Adjacent text
 * nodes are collected into implicit paragraphs. Empty paragraphs are
 * preserved as empty strings so blank-line spacing survives a round-trip.
 */
export function editorHtmlToParagraphs(html: string): string[] {
  if (!html || !html.trim()) return [];

  const container = document.createElement("div");
  container.innerHTML = html;

  const paragraphs: string[] = [];

  const flushBuffer = (buffer: string[]) => {
    const text = buffer.join("").trim();
    if (text) paragraphs.push(text);
    buffer.length = 0;
  };

  const buffer: string[] = [];

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (BLOCK_TAGS.includes(tag)) {
        flushBuffer(buffer);
        if (tag === "LI") {
          paragraphs.push(el.innerHTML.trim() || "");
        } else if (tag === "BLOCKQUOTE") {
          const inner = el.innerHTML.trim();
          if (inner) paragraphs.push(inner);
        } else {
          const inner = el.innerHTML.trim();
          paragraphs.push(inner === "<br>" ? "" : inner);
        }
      } else {
        // Inline element (span, strong, em, etc.) — keep in buffer
        buffer.push((el as HTMLElement).outerHTML);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim()) buffer.push(text);
    }
  }
  flushBuffer(buffer);

  return paragraphs;
}
