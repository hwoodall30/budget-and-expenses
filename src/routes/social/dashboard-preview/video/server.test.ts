import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from './$types';

vi.mock('$app/server', () => ({
	read: () => new Response(new Uint8Array([0, 1, 2, 3, 4, 5]))
}));
import { GET, HEAD } from './+server';

function event(range?: string) {
	return {
		request: new Request('https://example.com/social/dashboard-preview/video', {
			headers: range ? { Range: range } : {}
		})
	} as RequestEvent;
}

describe('share preview video delivery', () => {
	it('provides the full downloadable MP4 and its length', async () => {
		const response = await GET(event());
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('video/mp4');
		expect(response.headers.get('content-length')).toBe('6');
		expect(response.headers.get('accept-ranges')).toBe('bytes');
		expect(response.headers.get('cache-control')).toBe('no-store, no-transform');
		expect(response.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
	});
	it.each([
		['bytes=1-3', 'bytes 1-3/6', [1, 2, 3]],
		['bytes=4-', 'bytes 4-5/6', [4, 5]],
		['bytes=-2', 'bytes 4-5/6', [4, 5]],
		['bytes=4-99', 'bytes 4-5/6', [4, 5]]
	])('serves the requested bytes for %s', async (range, expectedRange, bytes) => {
		const response = await GET(event(range));
		expect(response.status).toBe(206);
		expect(response.headers.get('content-range')).toBe(expectedRange);
		expect(response.headers.get('content-length')).toBe(String(bytes.length));
		expect([...new Uint8Array(await response.arrayBuffer())]).toEqual(bytes);
	});
	it('rejects unsatisfiable ranges', async () => {
		const response = await GET(event('bytes=9-'));
		expect(response.status).toBe(416);
		expect(response.headers.get('content-range')).toBe('bytes */6');
	});
	it('includes metadata without a body for HEAD', async () => {
		const response = await HEAD(event());
		expect(response.headers.get('content-length')).toBe('6');
		expect(await response.text()).toBe('');
	});
});
