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

## Apple-ID

Die App startet Sign in with Apple über Supabase. Der geheime Apple-Schlüssel bleibt im Supabase-Projekt, nicht in der Nuxt-App.

Im Apple Developer Account:

1. App-ID mit Sign in with Apple.
2. Services-ID. Domain: die Domain des Supabase-Projekts. Rücksprung-URL: `https://<projekt>.supabase.co/auth/v1/callback`.
3. Signatur-Schlüssel (`.p8`) und daraus das Client-Secret. Apple verlangt ein neues Secret alle 6 Monate.

Im Supabase-Dashboard unter Authentication:

- Provider Apple aktivieren. Client-ID ist die Services-ID, Secret ist das erzeugte Client-Secret.
- Redirect-URLs erlauben: `http://127.0.0.1:38471/auth/callback` und die Produktionsadresse mit dem Pfad `/auth/callback`.

Lokal bleibt `[auth.external.apple]` in `supabase/config.toml` aus, bis `client_id` und `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET` gesetzt sind.

## Datenbank

Migration: `supabase/migrations`. Nach `supabase login` und Verknüpfung des Projekts:

```bash
bunx supabase db push
```

RLS: jede Person liest und schreibt nur eigene Zeilen. Wer eine aktive Freigabe hat, darf den Plan lesen. Die Person, die den Plan teilt, darf die Push-Endpunkte der lesenden Person für den Versand lesen.
