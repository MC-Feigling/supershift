# Schichtwerk

Persönlicher Schichtplan. Nuxt 3, Vue 3, TypeScript, Tailwind, Pinia, Supabase.

## Lokal

```bash
bun install
cp .env.example .env
```

In `.env` die öffentlichen Werte aus dem Supabase-Projekt eintragen. Den service_role-Schlüssel nicht verwenden.

VAPID-Schlüssel für Push:

```bash
npx web-push generate-vapid-keys
```

Öffentlichen Schlüssel, privaten Schlüssel und `mailto:`-Adresse in `.env` und in den Vercel-Umgebungsvariablen setzen.

```bash
bun run dev
```

Die App läuft auf [http://127.0.0.1:38471](http://127.0.0.1:38471).

Ohne gültige Supabase-Werte zeigt die Oberfläche einen Einrichtungshinweis. Ohne VAPID-Werte bleibt Push aus.

## Datenbank

Migration: `supabase/migrations`. Nach `supabase login` und Verknüpfung des Projekts:

```bash
bunx supabase db push
```

RLS: jede Person liest und schreibt nur eigene Zeilen. Wer eine aktive Freigabe hat, darf den Plan lesen. Mit Schreibrecht darf sie Einträge setzen und entfernen, nicht die Schichten. Die andere Person darf die Push-Endpunkte für den Versand lesen. Eine offene Freigabe entsteht per E-Mail oder per Link; den Link nimmt die erste angemeldete Person an.
