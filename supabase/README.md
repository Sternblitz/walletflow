# Supabase Edge Functions für Passify

Dieses Verzeichnis enthält Supabase Edge Functions für das Automation-System.

## Funktionen

### `execute-automations`

Führt Automatisierungsregeln aus:
- **Geburtstag**: Sendet Nachrichten an Kunden mit Geburtstag
- **Wochentag**: Sendet Nachrichten an bestimmten Wochentagen
- **Inaktivität**: Erinnert inaktive Kunden
- **Custom**: Benutzerdefinierte Trigger

## Deployment

```bash
# Supabase CLI installieren
npm install -g supabase

# Login
supabase login

# Projekt verknüpfen
supabase link --project-ref YOUR_PROJECT_REF

# Edge Function deployen
supabase functions deploy execute-automations
```

## Environment Variables

Die Edge Function benötigt:
- `SUPABASE_URL` (automatisch verfügbar)
- `SUPABASE_SERVICE_ROLE_KEY` (automatisch verfügbar)

## pg_cron Setup

Nach dem Deployment, führe die SQL in 
`database/migrations/setup_pg_cron_automations.sql` aus.
