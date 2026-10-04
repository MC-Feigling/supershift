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

Gäste registrieren sich auf `/`. Die Bestätigungsmail von Supabase zeigt auf `/bestaetigen`. Im Supabase-Dashboard (Auth, URL-Konfiguration) eintragen:

- `https://supershift-sigma.vercel.app/bestaetigen`
- `http://127.0.0.1:38471/bestaetigen`
- dieselben Origins für `/einladung`

Einladungsmail ist kein Supabase-Auth-Versand. Dafür auf dem Server, lokal in `.env`:

```bash
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Fehlen die Werte, bleibt der Einladungslink nutzbar. Die Oberfläche sagt, dass die Mail nicht eingerichtet ist. Den service_role-Schlüssel nicht verwenden.

## Datenbank

Migration: `supabase/migrations`. Nach `supabase login` und Verknüpfung des Projekts:

```bash
bunx supabase db push
```

RLS: jede Person liest und schreibt nur eigene Zeilen. Wer eine aktive Freigabe hat, darf den Plan lesen.
