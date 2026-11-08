import { read } from '$app/server';
import video from '#lib/assets/dashboard-preview.mp4?url';
import { attempt } from '#lib/helpers/attempt.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const result = await attempt<string, ArrayBuffer>(async () => read(video).arrayBuffer());
	if (result.error !== null) return new Response('Preview unavailable', { status: 503 });
	const bytes = result.data;
	const size = bytes.byteLength;
	const headers = new Headers({
		'Content-Type': 'video/mp4',
		'Content-Length': String(size),
		'Accept-Ranges': 'bytes',
		// Avoid CDN extension-based media caching, which altered range responses in production.
		'Cache-Control': 'no-store, no-transform',
		'CDN-Cache-Control': 'no-store',
		'Cloudflare-CDN-Cache-Control': 'no-store'
	});
	const range = request.headers.get('range');
	// Without a validator, If-Range must fall back to the complete representation.
	if (!range || request.headers.has('if-range')) return new Response(bytes, { headers });
	const match = /^bytes=(\d*)-(\d*)$/.exec(range);
	// Ignore unsupported/malformed ranges, including multipart ranges.
	if (!match || (!match[1] && !match[2])) return new Response(bytes, { headers });
	const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
	const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
	if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
		headers.set('Content-Range', `bytes */${size}`);
		headers.set('Content-Length', '0');
		return new Response(null, { status: 416, headers });
	}
	headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
	headers.set('Content-Length', String(end - start + 1));
	return new Response(bytes.slice(start, end + 1), { status: 206, headers });
};

export const HEAD: RequestHandler = async (event) => {
	const response = await GET(event);
	return new Response(null, { status: response.status, headers: response.headers });
};
