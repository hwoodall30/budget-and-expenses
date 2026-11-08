<script lang="ts">
	import { page } from '$app/state';
	import PrototypePage from './_components/prototype-page.svelte';

	const title = 'A little clarity for every ministry dollar';
	const description =
		'Plan thoughtfully. Record simply. See what’s available. Explore the ministry budget dashboard with fictional sample data.';
	const image = $derived(new URL('/social/dashboard.jpg', page.url.origin).href);
	const video = $derived(new URL('/social/dashboard-preview/video', page.url.origin).href);
</script>

<svelte:head>
	<title>Ministry budget · Workflow prototype</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:site_name" content="Ministry budget" />
	<meta property="og:url" content={new URL('/', page.url.origin).href} />
	<meta property="og:image" content={image} />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Ministry budget dashboard showing sample annual budget, available funds, and projected balance."
	/>
	<meta property="og:video" content={video} />
	<meta property="og:video:type" content="video/mp4" />
	<meta property="og:video:width" content="1200" />
	<meta property="og:video:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content="Ministry budget dashboard with fictional sample data." />
</svelte:head>
<PrototypePage />
