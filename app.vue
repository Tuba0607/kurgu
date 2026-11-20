<script setup lang="ts">
const APP_NAME = 'Kilit Content Studio'

useHead({
  titleTemplate: title => (title ? `${title} · ${APP_NAME}` : APP_NAME),
})
</script>

<template>
  <NuxtLoadingIndicator
    color="#EA0029"
    :height="2"
  />
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToastContainer />
</template>
