<script setup lang="ts">
const APP_NAME = 'kurgu.'

useHead({
  titleTemplate: title => (title && title !== APP_NAME ? `${title} · ${APP_NAME}` : `${APP_NAME} — Müşteri ve içerik takip paneli`),
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
