<script setup lang="ts">
const APP_NAME = 'kurgu.'

useHead({
  titleTemplate: title => (title && title !== APP_NAME ? `${title} · ${APP_NAME}` : `${APP_NAME} — Müşteri ve içerik takip paneli`),
})

// Link previews (Open Graph / X): the same defaults on every page; og:url follows the page.
// Crawlers need absolute URLs, so they are built from the public site URL.
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
const route = useRoute()
const SHARE_TITLE = 'kurgu. — Müşteri ve İçerik Takip Paneli'
const SHARE_DESCRIPTION = 'Ajans hesap yöneticileri için müşteri ve içerik takip paneli.'
const SHARE_IMAGE = `${siteUrl}/og.png`

useSeoMeta({
  ogType: 'website',
  ogSiteName: APP_NAME,
  ogLocale: 'tr_TR',
  ogTitle: SHARE_TITLE,
  ogDescription: SHARE_DESCRIPTION,
  ogUrl: () => `${siteUrl}${route.path === '/' ? '' : route.path}`,
  ogImage: SHARE_IMAGE,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  ogImageAlt: 'kurgu. logosu ve panelin Genel bakış ekranı',
  twitterCard: 'summary_large_image',
  twitterTitle: SHARE_TITLE,
  twitterDescription: SHARE_DESCRIPTION,
  twitterImage: SHARE_IMAGE,
  twitterImageAlt: 'kurgu. logosu ve panelin Genel bakış ekranı',
})
</script>

<template>
  <NuxtLoadingIndicator
    color="#E8664A"
    :height="2"
  />
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToastContainer />
</template>
