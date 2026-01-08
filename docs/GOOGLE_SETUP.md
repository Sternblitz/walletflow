# Google Wallet API Setup Guide

Dieser Guide führt dich durch die Einrichtung der Google Wallet API für Passify.

## Voraussetzungen

- Google Account
- Zugriff auf Google Cloud Console
- Google Pay API aktiviert

## Schritt 1: Google Cloud Project erstellen

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com)
2. Klicke auf **Select a project** > **New Project**
3. Gib einen Projektnamen ein (z.B. "Passify")
4. Klicke auf **Create**
5. Warte, bis das Projekt erstellt wurde

## Schritt 2: Google Pay API aktivieren

1. In der Google Cloud Console, gehe zu **APIs & Services > Library**
2. Suche nach **Google Pay API**
3. Klicke auf **Google Pay API** und dann **Enable**
4. Warte, bis die API aktiviert ist

## Schritt 3: Google Pay Console Account erstellen

1. Gehe zu [Google Pay & Wallet Console](https://pay.google.com/business/console)
2. Melde dich mit deinem Google Account an
3. Klicke auf **Get Started** oder **Create Account**
4. Fülle die Geschäftsinformationen aus:
   - Business Name
   - Business Address
   - Contact Information
5. Akzeptiere die Nutzungsbedingungen
6. Warte auf die Verifizierung (kann einige Tage dauern)

## Schritt 4: Issuer Account erstellen

1. In der Google Pay & Wallet Console, gehe zu **Issuers**
2. Klicke auf **Create Issuer Account**
3. Gib folgende Informationen ein:
   - **Issuer Name**: Dein Geschäftsname (z.B. "Passify Agency")
   - **Issuer ID**: Wird automatisch generiert (z.B. `3388000000022345678`)
   - **Contact Email**: Deine E-Mail-Adresse
4. Klicke auf **Create**
5. **Wichtig**: Notiere dir die **Issuer ID** - du wirst sie später benötigen

## Schritt 5: Service Account erstellen

1. In der Google Cloud Console, gehe zu **IAM & Admin > Service Accounts**
2. Klicke auf **Create Service Account**
3. Gib einen Namen ein (z.B. "passify-wallet-service")
4. Klicke auf **Create and Continue**
5. Gib eine Rolle ein (z.B. "Editor") oder überspringe diesen Schritt
6. Klicke auf **Done**

## Schritt 6: Service Account Key generieren

1. Klicke auf den neu erstellten Service Account
2. Gehe zum Tab **Keys**
3. Klicke auf **Add Key > Create new key**
4. Wähle **JSON** Format
5. Klicke auf **Create**
6. Die JSON-Datei wird automatisch heruntergeladen
7. **Wichtig**: Speichere diese Datei sicher - sie enthält deine Credentials

## Schritt 7: Service Account zu Google Pay Console hinzufügen

1. In der Google Pay & Wallet Console, gehe zu **Issuers**
2. Wähle deinen Issuer Account aus
3. Gehe zum Tab **Service Accounts**
4. Klicke auf **Add Service Account**
5. Gib die **Service Account Email** ein (findest du in der JSON-Datei unter `client_email`)
6. Klicke auf **Add**

## Schritt 8: Class ID erstellen

1. In der Google Pay & Wallet Console, gehe zu **Classes**
2. Klicke auf **Create Class**
3. Wähle **Loyalty** als Pass Type
4. Fülle die erforderlichen Felder aus:
   - **Class ID**: Eindeutige ID (z.B. `passify_loyalty_default`)
   - **Issuer Name**: Dein Geschäftsname
   - **Program Name**: Name deines Loyalty-Programms
5. Konfiguriere die visuellen Elemente (Logo, Farben, etc.)
6. Klicke auf **Save**
7. **Wichtig**: Notiere dir die **Class ID** - du wirst sie später benötigen

## Schritt 9: Environment Variables konfigurieren

Füge folgende Variablen zu deiner `.env` Datei hinzu:

```bash
# Google Wallet Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./certs/google-service-account.json
GOOGLE_WALLET_CLASS_ID=passify_loyalty_default
GOOGLE_ISSUER_ID=3388000000022345678
```

**Wichtig**: 
- Speichere die Service Account JSON-Datei in einem `certs/` Verzeichnis
- Füge `certs/` zu deiner `.gitignore` hinzu
- Die Issuer ID findest du in der Google Pay Console unter deinem Issuer Account

## Schritt 10: Verzeichnisstruktur

Erstelle folgende Verzeichnisstruktur:

```
passify/
├── certs/
│   ├── google-service-account.json
│   └── ...
├── .env
└── ...
```

## Alternative: Environment Variable als JSON String

Falls du die JSON-Datei nicht als Datei speichern möchtest, kannst du den Inhalt auch direkt als Environment Variable setzen:

```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

## Troubleshooting

### "Service account not authorized"
- Stelle sicher, dass der Service Account in der Google Pay Console hinzugefügt wurde
- Überprüfe, dass die Service Account Email korrekt ist

### "Class ID not found"
- Überprüfe, dass die Class ID in der Google Pay Console existiert
- Stelle sicher, dass die Class ID dem richtigen Issuer zugeordnet ist

### "Invalid issuer ID"
- Überprüfe die Issuer ID in der Google Pay Console
- Stelle sicher, dass keine Leerzeichen oder zusätzliche Zeichen vorhanden sind

### "Authentication failed"
- Überprüfe, dass die Service Account JSON-Datei korrekt ist
- Stelle sicher, dass der Pfad in `.env` korrekt ist
- Überprüfe, dass die Google Pay API aktiviert ist

## Nächste Schritte

Nach erfolgreicher Einrichtung kannst du mit der Implementierung des Google Wallet Services fortfahren. Siehe `src/lib/wallet/google.ts` für die Integration.

## Wichtige Links

- [Google Pay API Documentation](https://developers.google.com/wallet)
- [Google Pay & Wallet Console](https://pay.google.com/business/console)
- [Google Cloud Console](https://console.cloud.google.com)




