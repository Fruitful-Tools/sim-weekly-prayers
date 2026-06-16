// Build a concise, plain-text meta description from prayer markdown content.
// Strips markdown syntax (headings, emphasis, links, images, code) so search
// engines and AI crawlers get clean snippet text, then truncates to a length
// that fits within the typical search-result snippet.
export function toMetaDescription(markdown: string, maxLength = 155): string {
  const text = (markdown || '')
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`([^`]*)`/g, '$1') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // ATX headings
    .replace(/[*_~>#]/g, ' ') // residual markdown symbols
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();

  // Slice by code points (Array.from), not UTF-16 units, so truncation never
  // splits a surrogate pair (e.g. an emoji) into a broken trailing glyph.
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return (
    chars
      .slice(0, maxLength - 1)
      .join('')
      .trimEnd() + '…'
  );
}
