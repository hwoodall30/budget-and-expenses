import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Run against a local dev server. The page starts with fictional sample data.
const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:5173';
const frames = '/tmp/budget-share-frames';
await mkdir(frames, { recursive: true });
await mkdir('static/social', { recursive: true });
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		deviceScaleFactor: 1,
		colorScheme: 'light'
	});
	await page.goto(origin);
	await page.locator('[data-testid="available"]').waitFor();
	await page.evaluate(() => document.fonts.ready);
	await page.addStyleTag({
		content:
			'header { display: none !important; } main { padding-top: 28px !important; } body { overflow: hidden; }'
	});
	await page.screenshot({ path: 'static/social/dashboard.jpg', type: 'jpeg', quality: 90 });
	await page.evaluate(() => {
		const targets = [...document.querySelectorAll('main > div, main > section')];
		window.previewAnimations = targets.map((element, index) => {
			const animation = element.animate(
				[
					{ opacity: 0, transform: 'translateY(24px) scale(.98)' },
					{ opacity: 1, transform: 'translateY(0) scale(1)' }
				],
				{ duration: 900, delay: index * 180, fill: 'both', easing: 'cubic-bezier(.16,1,.3,1)' }
			);
			animation.pause();
			return animation;
		});
	});
	for (let frame = 0; frame < 120; frame++) {
		await page.evaluate(
			(time) => {
				window.previewAnimations.forEach((animation) => {
					animation.currentTime = time;
				});
			},
			(frame * 1000) / 24
		);
		await page.screenshot({ path: `${frames}/${String(frame).padStart(3, '0')}.png` });
	}
} finally {
	await browser.close();
}
// Native macOS encoder: no extra runtime dependency in the website.
execFileSync(
	'swift',
	['scripts/encode-share-preview.swift', frames, 'static/social/dashboard.mp4'],
	{ stdio: 'inherit' }
);
