<script setup lang="ts">
definePageMeta({ layout: 'auth' })
await navigateTo('/', { redirectCode: 302 })
</script>

<template>
  <span class="sr-only">Weiter zur Registrierung.</span>
</template>
