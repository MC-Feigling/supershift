<script setup lang="ts">
const session = useSession()
const loggedIn = computed(() => session.user.value !== null)

if (import.meta.client) {
  watch(loggedIn, (isLoggedIn: boolean) => {
    setPageLayout(isLoggedIn ? 'default' : 'auth')
  })
}

useHead(computed(() => ({
  title: loggedIn.value ? 'Kalender' : 'Registrieren',
})))
</script>

<template>
  <HomeCalendar v-if="loggedIn" />
  <AuthShell v-else>
    <HomeRegister />
  </AuthShell>
</template>
