<script lang="ts">
	import {page} from "$app/state";
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="icon" type="image/png" href="/favicon-48x48.png" sizes="48x48" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content={page.data.env.name} />
  <link rel="manifest" href="/site.webmanifest" />

  <!-- OpenGraph/Twitter tags -->
  <meta property="og:title" content={page.data.env.name} />
  <meta
    property="og:description"
    content="LHS Scheduling, Done Right."
  />
  <meta property="og:image" content="/screenshots/desktop.png" />
  <meta property="og:url" content="https://zoron.app" />
  <meta property="og:type" content="website" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={page.data.env.name} />
  <meta
    name="twitter:description"
    content="LHS Scheduling, Done Right."
  />
  <meta name="twitter:image" content="/screenshots/desktop.png" />
</svelte:head>