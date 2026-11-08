/**
 * Deterministic hue (0–359) for a category name.
 *
 * FNV-1a hash with a murmur3 finalizer so similar names still spread across the
 * color wheel. The theme (`category-tone` in layout.css) supplies lightness and
 * chroma per color mode, so only the hue is derived from the name.
 */
export function categoryHue(name: string): number {
	let hash = 0x811c9dc5;
	for (const char of name.trim().toLowerCase()) {
		hash ^= char.codePointAt(0)!;
		hash = Math.imul(hash, 0x01000193);
	}
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 0x85ebca6b);
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 0xc2b2ae35);
	hash ^= hash >>> 16;
	return (hash >>> 0) % 360;
}

/** Inline style that feeds the `category-tone` utility for an element. */
export function categoryStyle(name: string): string {
	return `--category-hue: ${categoryHue(name)}`;
}
