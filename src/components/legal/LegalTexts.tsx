
export const TermsContent = () => (
    <div className="space-y-6 text-sm text-gray-600 leading-relaxed font-sans">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Nutzungsbedingungen für digitale QARD-Karten (Endnutzer)</h2>

        <section>
            <h4 className="text-gray-900 font-bold mb-2">Anbieter der technischen Plattform (QARD):</h4>
            <p>
                Lano Aziz – Link4all<br />
                Sankt-Gallen-Ring 83<br />
                90431 Nürnberg<br />
                E-Mail: hello@getqard.com<br />
                Web: getqard.com
            </p>
        </section>

        <section>
            <p><strong>Geltungsbereich:</strong> Deutschland und Europäischer Wirtschaftsraum (EWR)</p>
            <p><strong>Stand:</strong> 21. Januar 2026</p>
            <p className="mt-2">
                Diese Nutzungsbedingungen gelten für die Nutzung digitaler Kunden-, Mitglieds-, Bonus- und Vorteilskarten, die über die Plattform <strong>QARD</strong> bereitgestellt und in Wallet-Apps (z. B. Apple Wallet, Google Wallet) auf mobilen Endgeräten gespeichert werden können (nachfolgend „Karte“).
            </p>
        </section>

        <section>
            <h4 className="text-gray-900 font-bold mb-2">1. Begriffe</h4>
            <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Karte:</strong> Eine digitale Karte, die Sie in Ihrer Wallet-App speichern und beim Kartenanbieter verwenden können.</li>
                <li><strong>Kartenanbieter:</strong> Das Unternehmen, der Verein oder die Organisation, von dem bzw. der Sie die Karte erhalten (z. B. Restaurant, Fitnessstudio, Barber, Studio). Der Kartenanbieter bestimmt Inhalt, Vorteile, Einlösebedingungen und Laufzeiten.</li>
                <li><strong>QARD:</strong> QARD stellt die technische Plattform bereit, über die Karten erstellt, ausgeliefert, aktualisiert und verwaltet werden.</li>
                <li><strong>Wallet-App:</strong> Die App bzw. Systemfunktion Ihres Geräts, über die Wallet-Karten gespeichert werden, z. B. Apple Wallet oder Google Wallet.</li>
            </ol>
        </section>

        <section>
            <h4 className="text-gray-900 font-bold mb-2">2. Rolle von QARD und Rolle des Kartenanbieters</h4>
            <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Kartenanbieter ist zuständig für Programm und Inhalte:</strong> Der Kartenanbieter ist verantwortlich für Vorteile, Aktionen, Rabatte, Prämien, Punkte, Stempelstände, Einlösebedingungen, Laufzeiten und alle sonstigen Inhalte der Karte.</li>
                <li><strong>QARD ist technische Plattform:</strong> QARD stellt die technische Infrastruktur zur Verfügung, damit der Kartenanbieter Karten bereitstellen, aktualisieren und optional Wallet-Push-Mitteilungen versenden kann.</li>
                <li><strong>Freigabeprozess für Wallet-Push-Mitteilungen:</strong> Wenn der Kartenanbieter Wallet-Push-Mitteilungen versenden möchte, erstellt er die Inhalte und beantragt den Versand über die QARD-Plattform. QARD kann solche Anfragen aus technischen, sicherheitsbezogenen oder compliance-bezogenen Gründen genehmigen oder ablehnen. Die Verantwortung für Inhalt, Zweck, rechtliche Zulässigkeit und die Auswahl der Zielgruppe verbleibt beim Kartenanbieter.</li>
            </ol>
        </section>
    </div>
)

export const PrivacyContent = () => (
    <div className="space-y-6 text-sm text-gray-600 leading-relaxed font-sans">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Datenschutzerklärung QARD</h2>

        <section>
            <h4 className="text-gray-900 font-bold mb-2">Verantwortlicher</h4>
            <p>
                Lano Aziz – Link4all, Betreiber der Plattform „QARD“<br />
                Sankt-Gallen-Ring 83<br />
                90431 Nürnberg<br />
                E-Mail: hello@getqard.com<br />
                Web: getqard.com
            </p>
        </section>

        <section>
            <p><strong>Stand:</strong> 21. Januar 2026</p>
            <p className="mt-2">
                Diese Datenschutzerklärung erläutert, wie wir personenbezogene Daten verarbeiten, wenn Sie eine digitale Karte über QARD nutzen, sowie wenn Sie unsere Website und Onboarding-Bereiche verwenden.
            </p>
        </section>

        <section>
            <h4 className="text-gray-900 font-bold mb-2">1. Kurzüberblick: Wer macht was</h4>
            <h5 className="font-bold mb-1">1.1 Kartenanbieter und QARD</h5>
            <p className="mb-2">
                Wenn Sie eine digitale Karte zu Apple Wallet oder Google Wallet hinzufügen, erhalten Sie diese Karte von einem konkreten Unternehmen, Verein oder einer Organisation (im Folgenden „Kartenanbieter“). Der Kartenanbieter entscheidet, welche Daten er abfragt, welche Vorteile gelten und welche Kommunikation stattfinden soll.
            </p>
            <p className="font-bold mb-2">Regelmodell</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Der Kartenanbieter ist Verantwortlicher für die Verarbeitung im Rahmen seines Kundenprogramms.</li>
                <li>QARD verarbeitet Daten im Auftrag des Kartenanbieters, um die Karte technisch bereitzustellen, zu aktualisieren und Wallet-Funktionen zu ermöglichen.</li>
            </ul>
            <p className="font-bold mb-2">Auftragsverarbeitung (Art. 28 DSGVO)</p>
            <p className="mb-2">
                Soweit QARD personenbezogene Daten für den Kartenanbieter verarbeitet, erfolgt dies auf Grundlage eines Auftragsverarbeitungsvertrags gemäß Art. 28 DSGVO und ausschließlich nach Weisung des Kartenanbieters.
            </p>
            <p className="mb-2">
                Zusätzlich verarbeiten wir bestimmte Daten als eigener Verantwortlicher, soweit dies für den Betrieb der Plattform erforderlich ist, insbesondere für IT-Sicherheit, Missbrauchsprävention, Fehleranalyse, Support und die Bereitstellung unserer Website.
            </p>
            <h5 className="font-bold mb-1">1.2 Wallet-Anbieter</h5>
            <p>
                Apple Wallet und Google Wallet werden von Apple bzw. Google bereitgestellt. Diese Anbieter verarbeiten Daten in eigener Verantwortung, wenn Sie deren Wallet-Funktionen nutzen. Bitte beachten Sie zusätzlich die Datenschutzhinweise der jeweiligen Anbieter.
            </p>
        </section>
    </div>
)
