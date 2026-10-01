<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Einrichtung' })
</script>

<template>
  <AuthShell>
    <StatusNote
      tone="info"
      title="Verbindung fehlt"
      body="Schichtwerk braucht ein Supabase-Projekt. Lege eine Datei .env an und trage die öffentlichen Werte aus .env.example ein. Danach den Entwicklungsserver neu starten und die Migration aus supabase/migrations einspielen."
    />
  </AuthShell>
</template>
