# 01_VISION.md - The Passify Manifest

## 1. Die Core-Idee ("The Unfair Advantage")
Passify ist eine **High-End Loyalty Infrastruktur**, die sich anfühlt wie Magie.
Wir lösen das Kernproblem der Kundenbindung: **"App Fatigue"**.
Keiner will mehr Apps installieren. Aber jeder hat schon eine App: **Apple Wallet & Google Wallet**.

**Unsere Mission:**
Wir verwandeln diese vorinstallierten Wallets in einen mächtigen Marketing-Kanal für lokale Unternehmen.
*   **Ohne Download:** Ein Scan genügt.
*   **Ohne Anmeldung:** Keine Passwörter, keine Hürden.
*   **High-End:** Dank "Nano Bana" Design sehen die Pässe aus wie von einer $100k Agentur.

---

## 2. Das Geschäftsmodell ("Agency Engine")
Passify ist **kein** Self-Service Tool für Endkunden.
Es ist eine **White-Glove Agentur-Lösung**.

*   **Der Kunde (Gastronom):** Zahlt Setup + Abo.
    *   Er hat eine "Dual-Mode" App (Chef-PIN vs. Kellner-PIN).
    *   Er kann **nichts kaputt machen**.
    *   Er kann Push-Nachrichten nur **beantragen** ("Managed Push").
*   **Du (Die Agency):** Kontrollierst alles über das "Command Center".
    *   Du genehmigst Push-Nachrichten.
    *   Du behältst die Hoheit über das Design.
*   **Der End-User:** Nutzt den Pass, sammelt Punkte, kommt öfter.

---

## 3. Die technische Magie ("Universal Broker")
Das Herzstück ist eine Technologie, die wir **"Universal Wallet Broker"** nennen.
Sie überbrückt die Kluft zwischen den zwei Welten:

*   **Apple Welt:** Offline-first `.pkpass` Dateien.
*   **Android Welt:** Cloud-based Google Wallet Objects.

Unser System abstrahiert das.
Ein Befehl von dir: `updatePoints(User, 5)`
-> Das System entscheidet automatisch: "Sende APNs Push an iPhone" ODER "Sende API Call an Google".
**Ergebnis:** Eine perfekt synchrone Experience für 100% aller Smartphones.
