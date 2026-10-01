# Schichtwerk

Persönlicher Schichtplan. Nuxt 3, Vue 3, TypeScript, Tailwind, Pinia, Supabase.

## Lokal

```bash
bun install
cp .env.example .env
```

In `.env` die öffentlichen Werte aus dem Supabase-Projekt eintragen. Den service_role-Schlüssel nicht verwenden.

```bash
bun run dev
```

Die App läuft auf [http://127.0.0.1:38471](http://127.0.0.1:38471).

Ohne gültige Werte zeigt die Oberfläche einen Einrichtungshinweis.

## Datenbank

Migration: `supabase/migrations`. Nach `supabase login` und Verknüpfung des Projekts:

```bash
bunx supabase db push
```

RLS: jede Person liest und schreibt nur eigene Zeilen. Wer eine aktive Freigabe hat, darf den Plan lesen.
