# 02_FEATURES.md - Die Funktions-Matrix

## 1. Die Produkte (Konzepte)
Wir verkaufen keine "Technik", sondern Lösungen.

### A. "The Retainer" (Stempelkarte 2.0)
*   **Ziel:** Frequenz erhöhen.
*   **Logik:** Sammeln bis X, dann Belohnung.
*   **Visual:** Fortschrittsbalken oder Stempel-Grid.
*   **Use-Case:** "Jeder 10. Kaffee gratis".

### B. "The Inner Circle" (VIP Club)
*   **Ziel:** Status & Exklusivität.
*   **Logik:** Binär (Member / Nicht Member) oder Tiers (Gold/Silver).
*   **Visual:** Hochwertiges Design (Schwarz/Gold), Name des Kunden groß.
*   **Use-Case:** "Türsteher-Pass", "10% Rabatt auf alles".



---

## 2. Die Technologie-Features

### Die "Smart Link" Weiche (Traffic Manager)
Ein einziger, intelligenter QR-Code regelt den Verkehr. Er erkennt das Gerät des Kunden im Sekundenbruchteil:
*   **Szenario A (iPhone):** Server generiert dynamisch eine `.pkpass` Datei und bietet den System-Dialog "Zu Apple Wallet hinzufügen" an.
*   **Szenario B (Android):** Server generiert einen signierten "Save to Google Pay" Deep-Link.
*   **Szenario C (Desktop/Unbekannt):** Eine schicke Landingpage erklärt das Konzept und zeigt den QR-Code nochmals an.

### Der "Phantom"-Download
*   Serverseitige Generierung von individuellen Pässen in < 200ms.
*   Jeder Pass hat eine einzigartige Serialnummer (Tracking).

---

## 4. The Ultimate Creation Workflow (Agency Dashboard)
So funktioniert dein "Command Center". Der Prozess ist linear und magisch.

### Schritt 1: Identität (The Base)
*   **Input:** Kunde anlegen (Name: "Burger King").
*   **Asset:** Logo hochladen.
*   **Struktur:** Das System erzwingt ein Layout: Logo immer oben mittig, Footer immer "Powered by [Deine Agentur]".

### Schritt 2: Konzept & Logik
*   **Wahl:** "Stempel" oder "VIP"?
*   **Config (Stempel):**
    *   Wie viele Felder? (z.B. 10).
    *   Animation? (z.B. "Stempel knallt drauf" oder "Balken füllt sich").
    *   Icon? (Kaffeetasse, Burger, Haken).
*   **Config (VIP):**
    *   Farbe & Tier-Name ("Gold Member").

### Schritt 3: Design by Nano Banana Pro (AI)
*   **Input:** "Mach es modern, schwarz, neon-grün."
*   **AI:** Generiert Hintergrund und Farben via API.
*   **Constraint:** Das Layout bleibt fix (Apple/Google Guidelines), nur der Look ändert sich.

### Schritt 4: Geofencing & Tech
*   **Input:** Adresse eingeben oder Pin auf Karte setzen.
*   **Message:** "Hey! Du bist in der Nähe. Komm rein für deinen Gratis-Kaffee!" (Erscheint auf Lockscreen).

### Schritt 5: The Big Bang (Generation)
Klick auf "Erstellen" triggert alles gleichzeitig:
1.  **Datenbank:** Client & Campaign werden angelegt.
2.  **Smart Link:** `passify.io/burger-king` wird generiert (für Endkunden).
3.  **Scanner App:** `pos.passify.io/burger-king` wird generiert.
4.  **Credentials:** User/Passwort für den Gastronomen (Chef) und Kellner (Staff) werden erstellt.


### Der "Managed Push" Workflow (Agency Control)
Der Gastronom kann *nicht* wild Nachrichten verschicken (Vermeidung von Spam/Fehlern).
Das läuft so:
1.  **Gastronom (Chef-Modus):** Tippt in seiner App: *"Bitte morgen um 18 Uhr Happy Hour an alle schicken!"*.
2.  **Agency (Du):** Du kriegst eine Meldung in deinem Command Center: *"Anfrage von Burger King Berlin"*.
3.  **Approval:** Du prüfst den Text, klickst auf "Genehmigen & Senden".
4.  **Versand:** Erst jetzt gehen die 5.000 Push-Nachrichten raus.
*Vorteil:* Du behältst die Kontrolle und kannst diesen Service extra berechnen.

