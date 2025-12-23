# 03_MASTER_ROADMAP.md - Der Weg zum Ziel

## Phase 1: Die Vorbereitung (Hausaufgaben) ⚠️
Bevor wir auch nur eine Zeile Code schreiben, brauchen wir die Schlüssel zum Königreich.
Ohne diese Keys können wir keine echten Pässe bauen.

*   [ ] **Apple Developer Account ($99/Jahr):**
    *   Registrieren.
    *   Pass Type ID Certificate erstellen.
    *   Exportieren als `.p12` + Passwort.
*   [ ] **Google Wallet API (Gratis):**
    *   Google Pay Console Account.
    *   Issuer Account erstellen.
    *   Service Account Key (`.json`) erstellen.

---

## Phase 2: Der "Universal Broker" (Backend Core)
Wir bauen den Motor (ohne UI).
*   [ ] Next.js API Routes für `POST /api/issue-pass`.
*   [ ] Library Integration: `passkit-generator` (Apple) & `google-auth-library`.
*   [ ] Die "Weiche": User-Agent Erkennung (iPhone vs Android).

---

## Phase 3: Das Command Center (Agency UI)
Wir bauen dein Cockpit.
*   [ ] Dashboard Setup (Next.js + Shadcn).
*   [ ] **The Creation Wizard:**
    *   [ ] Step 1: Client & Logo Upload.
    *   [ ] Step 2: Concept Selector (Stempel Logik vs VIP).
    *   [ ] Step 3: Design Studio (Nano Banana API Integration).
    *   [ ] Step 4: Geofencing Map (Google Maps Input).
*   [ ] **The Deployment Engine:**
    *   [ ] "Create" Button Logic: Generiert DB-Einträge, Smart Links und POS-Zugänge.
*   [ ] **Push-Approval Inbox:** Nachrichten-Anträge von Kunden prüfen & freigeben.

---

## Phase 4: Die "One-App" (Scanner & Dashboard)
Die Web-App für den Laden (Dual-Mode).
*   [ ] **PIN-Login System:** Weiche (Kellner / Chef).
*   [ ] **Modus A (Kellner):** Reiner Scanner mit Kamera-Zugriff.
*   [ ] **Modus B (Chef):** ROI-Dashboard (Stats sehen).
*   [ ] **Managed Push Interface:** Formular für "Nachricht beantragen".

---

## Phase 5: Der erste echte Test
1.  Du erstellst einen Test-Client ("Passify HQ").
2.  Du scannst den QR-Code mit deinem **echten** iPhone.
3.  Der Pass landet in deinem **echten** Wallet.
4.  Du sendest dir selbst eine Push-Nachricht.
-> **Proof of Concept Complete.**
