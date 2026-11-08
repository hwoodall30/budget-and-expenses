import { describe, expect, it } from 'vitest';
import { categoryHue, categoryStyle } from './category-color';
import { categories } from '#lib/prototype/budget.ts';

describe('categoryHue', () => {
	it('is stable for the same name, ignoring case and outer whitespace', () => {
		expect(categoryHue('Admin')).toBe(categoryHue('Admin'));
		expect(categoryHue(' admin ')).toBe(categoryHue('Admin'));
	});

	it('returns a hue within the color wheel', () => {
		for (const category of categories) {
			const hue = categoryHue(category);
			expect(Number.isInteger(hue)).toBe(true);
			expect(hue).toBeGreaterThanOrEqual(0);
			expect(hue).toBeLessThan(360);
		}
	});

	it('gives the sample categories varied hues', () => {
		expect(new Set(categories.map(categoryHue)).size).toBe(categories.length);
	});

	it('builds the style consumed by the category-tone utility', () => {
		expect(categoryStyle('Admin')).toBe(`--category-hue: ${categoryHue('Admin')}`);
	});
});
