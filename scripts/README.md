# Link preview assets

The home page advertises a silent, five-second H.264 MP4 for Apple Messages and a
1200 × 630 JPEG fallback for other apps. Both show fictional initial dashboard data.
Playback and caching are controlled by the receiving app; animation is not universal.

To regenerate on macOS, start `bun run dev`, then run:

```sh
node scripts/generate-share-preview.mjs
```

Requires the installed Playwright Chromium browser and Apple's Swift command-line
tools (AVFoundation). Set `PREVIEW_ORIGIN` if the local server uses another port.
The script captures the local dashboard, stages PNG frames in `/tmp/budget-share-frames`,
and replaces the checked-in assets in `static/social/`. No encoder runs in production.

Deploy the assets alongside the page on a public HTTPS origin. Ensure the deployment
passes the public origin correctly to SvelteKit (for adapter-node, configure `ORIGIN`
or trusted proxy headers). Metadata URLs are absolute and use the request origin.
Check the deployed HTML and share its URL in Messages on a real device; localhost
cannot be fetched by messaging services. Existing conversations may cache old previews.

Apple's metadata guidance:
https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages
