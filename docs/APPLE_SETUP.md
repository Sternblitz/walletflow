# Apple Wallet Setup Guide

Dieser Guide führt dich durch die Einrichtung deines Apple Developer Accounts und die Erstellung der notwendigen Zertifikate für Passify.

## Voraussetzungen

- Apple Developer Account ($99/Jahr)
- Mac mit Keychain Access
- Zugriff auf Apple Developer Portal

## Schritt 1: Apple Developer Account Registrierung

1. Gehe zu [developer.apple.com](https://developer.apple.com)
2. Melde dich mit deiner Apple ID an
3. Registriere dich für das Apple Developer Program ($99/Jahr)
4. Warte auf die Bestätigung (kann 24-48 Stunden dauern)

## Schritt 2: Pass Type ID erstellen

1. Logge dich im [Apple Developer Portal](https://developer.apple.com/account) ein
2. Gehe zu **Certificates, Identifiers & Profiles**
3. Wähle **Identifiers** aus dem linken Menü
4. Klicke auf das **+** Symbol oben links
5. Wähle **Pass Type IDs** aus
6. Klicke auf **Continue**
7. Gib eine **Description** ein (z.B. "Passify Loyalty Passes")
8. Gib eine **Identifier** ein (z.B. `pass.com.passify.loyalty`)
   - **Wichtig**: Dieser Identifier muss im Format `pass.com.deinedomain.appname` sein
   - Er muss eindeutig sein und kann später nicht geändert werden
9. Klicke auf **Continue** und dann **Register**

## Schritt 3: Pass Type ID Certificate erstellen

1. Wähle deine neu erstellte **Pass Type ID** aus der Liste
2. Aktiviere das Häkchen bei **Pass Type ID Certificate**
3. Klicke auf **Configure**
4. Wähle **Create Certificate**
5. Folge den Anweisungen zum Erstellen eines Certificate Signing Request (CSR):
   - Öffne **Keychain Access** auf deinem Mac
   - Gehe zu **Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority**
   - Gib deine E-Mail-Adresse und einen Namen ein
   - Wähle **Saved to disk** aus
   - Speichere die `.certSigningRequest` Datei
6. Lade die `.certSigningRequest` Datei im Apple Developer Portal hoch
7. Klicke auf **Continue** und dann **Download**
8. Speichere die `.cer` Datei

## Schritt 4: Certificate in Keychain importieren

1. Doppelklicke auf die heruntergeladene `.cer` Datei
2. Sie wird automatisch in deinen Keychain importiert
3. Öffne **Keychain Access**
4. Suche nach deinem Certificate (Name sollte deine Pass Type ID enthalten)
5. Stelle sicher, dass sowohl das **Certificate** als auch der zugehörige **Private Key** sichtbar sind

## Schritt 5: Certificate als .p12 exportieren

1. In **Keychain Access**, wähle dein Certificate aus
2. Klicke mit der rechten Maustaste und wähle **Export**
3. Wähle **Personal Information Exchange (.p12)** Format
4. Gib einen Dateinamen ein (z.B. `passify-cert.p12`)
5. **Wichtig**: Gib ein sicheres Passwort ein - du wirst es später in der `.env` Datei benötigen
6. Speichere die Datei an einem sicheren Ort

## Schritt 6: WWDR Certificate herunterladen

1. Gehe zu [Apple Worldwide Developer Relations Intermediate Certificate](https://www.apple.com/certificateauthority/)
2. Lade das **Apple Worldwide Developer Relations Intermediate Certificate** herunter
3. Speichere es als `AppleWWDRCA.cer`

## Schritt 7: Environment Variables konfigurieren

Füge folgende Variablen zu deiner `.env` Datei hinzu:

```bash
# Apple Wallet Configuration
APPLE_PASS_TYPE_ID=pass.com.passify.loyalty
APPLE_WWDR_CERT_PATH=./certs/AppleWWDRCA.cer
APPLE_SIGNER_CERT_PATH=./certs/passify-cert.p12
APPLE_SIGNER_KEY_PASSPHRASE=dein_sicheres_passwort_hier
```

**Wichtig**: 
- Speichere die Certificate-Dateien in einem `certs/` Verzeichnis im Projekt-Root
- Füge `certs/` zu deiner `.gitignore` hinzu, um die Zertifikate nicht zu committen
- Verwende absolute Pfade oder relative Pfade vom Projekt-Root

## Schritt 8: Verzeichnisstruktur

Erstelle folgende Verzeichnisstruktur:

```
passify/
├── certs/
│   ├── AppleWWDRCA.cer
│   └── passify-cert.p12
├── .env
└── ...
```

## Troubleshooting

### "Certificate not found"
- Stelle sicher, dass die Pfade in `.env` korrekt sind
- Verwende absolute Pfade wenn relative nicht funktionieren

### "Invalid pass type identifier"
- Überprüfe, dass deine Pass Type ID im Format `pass.com.domain.app` ist
- Stelle sicher, dass die ID in Apple Developer Portal registriert ist

### "Certificate password incorrect"
- Überprüfe das Passwort, das du beim Export des .p12 verwendet hast
- Stelle sicher, dass keine zusätzlichen Leerzeichen in der `.env` Datei sind

## Nächste Schritte

Nach erfolgreicher Einrichtung kannst du mit der Implementierung des Apple Wallet Services fortfahren. Siehe `src/lib/wallet/apple.ts` für die Integration.



