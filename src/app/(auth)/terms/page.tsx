'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-dark-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        Powrót
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Regulamin</h1>
      <p className="text-dark-400 text-sm mb-8">
        Regulamin korzystania z aplikacji Turbo Challenge. Wersja 1.0 z dnia 14.02.2026 r.
      </p>

      <div className="space-y-8 text-dark-300 text-sm leading-relaxed">
        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 1. Postanowienia ogólne
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizatorem aplikacji Turbo Challenge (dalej: &quot;Aplikacja&quot;) jest
              Fundacja Turbo Pomoc z siedzibą w Inwałdzie, ul. Wadowicka 165,
              34-120 Inwałd, wpisana do Rejestru Stowarzyszeń, Innych Organizacji
              Społecznych i Zawodowych, Fundacji oraz Samodzielnych Publicznych Zakładów
              Opieki Zdrowotnej Krajowego Rejestru Sądowego pod numerem KRS 0000892001,
              NIP 5512648557, REGON 388616737 (dalej: &quot;Organizator&quot;).
            </li>
            <li>
              Aplikacja ma charakter grywalizacyjny i służy popularyzacji celów
              statutowych Fundacji Turbo Pomoc oraz pozyskiwaniu środków na cele
              charytatywne zgodnie z ustawą z dnia 6 kwietnia 1984 r. o fundacjach
              (Dz.U. z 2023 r. poz. 166).
            </li>
            <li>
              Korzystanie z Aplikacji jest dobrowolne i bezpłatne (z wyjątkiem
              odpłatnego zakupu kart, o którym mowa w &sect; 5). Wymaga akceptacji
              niniejszego Regulaminu oraz Polityki prywatności.
            </li>
            <li>
              Regulamin stanowi regulamin świadczenia usług drogą elektroniczną
              w rozumieniu ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą
              elektroniczną (Dz.U. z 2020 r. poz. 344).
            </li>
          </ol>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 2. Definicje
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong className="text-white">Uczestnik</strong> — osoba fizyczna, która
              zarejestrowała konto w Aplikacji i zaakceptowała Regulamin.
            </li>
            <li>
              <strong className="text-white">Konto</strong> — indywidualne konto
              Uczestnika w Aplikacji, identyfikowane adresem e-mail i nickiem.
            </li>
            <li>
              <strong className="text-white">XP</strong> — punkty doświadczenia
              zdobywane przez Uczestnika za realizację misji i aktywność w Aplikacji.
            </li>
            <li>
              <strong className="text-white">Misja</strong> — zadanie do wykonania
              przez Uczestnika w zamian za XP.
            </li>
            <li>
              <strong className="text-white">Karta</strong> — wirtualna karta
              kolekcjonerska z wizerunkiem samochodu, przypisana do Konta Uczestnika.
            </li>
          </ol>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 3. Warunki uczestnictwa
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Uczestnikiem może zostać osoba fizyczna, która ukończyła 16 lat. Osoby
              w wieku 16–17 lat mogą korzystać z Aplikacji za zgodą rodzica lub
              opiekuna prawnego, zgodnie z art. 8 ust. 1 Rozporządzenia Parlamentu
              Europejskiego i Rady (UE) 2016/679 (RODO) w związku z art. 2 pkt 1
              ustawy z dnia 10 maja 2018 r. o ochronie danych osobowych.
            </li>
            <li>
              Rejestracja wymaga podania prawidłowego adresu e-mail, utworzenia hasła
              (minimum 8 znaków) oraz wybrania nicku (pseudonimu, 3–20 znaków).
              Rejestracja możliwa jest również za pośrednictwem konta Google (OAuth 2.0).
            </li>
            <li>
              Podanie numeru telefonu jest opcjonalne i służy wyłącznie do kontaktu
              w sprawie nagród.
            </li>
            <li>
              Każdy Uczestnik może posiadać wyłącznie jedno Konto. Tworzenie
              wielokrotnych kont jest zabronione.
            </li>
            <li>
              Rejestracja jest równoznaczna z akceptacją niniejszego Regulaminu
              i Polityki prywatności. Akceptacja jest potwierdzana zaznaczeniem
              odpowiedniego pola wyboru (checkbox) przed rejestracją.
            </li>
          </ol>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 4. Zasady gry
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Uczestnicy zdobywają punkty doświadczenia (XP) poprzez realizację misji
              różnych typów: skanowanie kodów QR, przesyłanie zdjęć, rozwiązywanie
              quizów, weryfikację lokalizacji GPS oraz zadania weryfikowane manualnie
              przez Organizatora.
            </li>
            <li>
              XP służy do awansowania na kolejne poziomy, udziału w tuningu
              wirtualnych samochodów oraz rywalizacji w rankingach.
            </li>
            <li>
              Uczestnicy mogą zbierać wirtualne Karty samochodów o różnych stopniach
              rzadkości (pospolita, rzadka, epicka, legendarna) oraz brać udział
              w bitwach PvP (Turbo Bitwy) — 3-rundowych pojedynkach opartych
              na parametrach Kart.
            </li>
            <li>
              Organizator zastrzega sobie prawo do modyfikacji zasad gry, wartości XP,
              dostępności misji, parametrów Kart oraz innych mechanik rozgrywki.
              O istotnych zmianach Uczestnicy zostaną powiadomieni w Aplikacji.
            </li>
            <li>
              Wszelkie elementy gry (XP, poziomy, Karty, wyniki bitew) mają charakter
              wyłącznie wirtualny i nie stanowią wartości pieniężnej.
            </li>
          </ol>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 5. Zakup Kart i darowizny
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Uczestnicy mogą nabywać Karty samochodów za opłatą. Środki uzyskane
              ze sprzedaży Kart stanowią darowiznę na rzecz Fundacji Turbo Pomoc
              i są w całości przeznaczane na cele statutowe Fundacji.
            </li>
            <li>
              Wpłaty realizowane są na rachunek bankowy Fundacji w Banku Pekao SA:
            </li>
          </ol>
          <div className="mt-3 p-4 bg-surface-2 rounded-xl border border-dark-600">
            <p className="text-white font-mono text-sm">
              47 1240 4197 1111 0011 0562 0407
            </p>
            <p className="text-dark-400 text-xs mt-1">
              Fundacja Turbo Pomoc, ul. Wadowicka 165, 34-120 Inwałd
            </p>
          </div>
          <ol className="list-decimal list-inside space-y-2 mt-4" start={3}>
            <li>
              Zakup Kart ma charakter darowizny w rozumieniu art. 888 Kodeksu
              cywilnego. Wpłacone środki nie podlegają zwrotowi, chyba że
              obowiązujące przepisy prawa stanowią inaczej.
            </li>
            <li>
              Karty mają charakter wyłącznie wirtualny — nie stanowią wartości
              pieniężnej i nie mogą być przedmiotem obrotu handlowego poza Aplikacją.
            </li>
            <li>
              Organizator wystawia potwierdzenie dokonania darowizny na życzenie
              Uczestnika, przesyłane na adres e-mail powiązany z Kontem.
            </li>
          </ol>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 6. Nagrody
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizator może przyznawać nagrody rzeczowe lub inne świadczenia
              Uczestnikom spełniającym określone kryteria (np. pozycja w rankingu,
              ukończenie zestawu misji, osiągnięcia w grze).
            </li>
            <li>
              Szczegółowe zasady przyznawania nagród, ich rodzaj, wartość oraz
              warunki odbioru będą każdorazowo ogłaszane przez Organizatora
              w Aplikacji przed rozpoczęciem danej aktywności.
            </li>
            <li>
              Nagrody nie podlegają zamianie na ekwiwalent pieniężny, chyba że
              Organizator wyraźnie postanowi inaczej.
            </li>
            <li>
              Odbiór nagród może wymagać podania dodatkowych danych osobowych (imię,
              nazwisko, adres do wysyłki) oraz kontaktu telefonicznego. Dane te będą
              przetwarzane wyłącznie w celu realizacji wysyłki nagrody.
            </li>
            <li>
              Nagrody o wartości przekraczającej kwotę wolną od podatku mogą podlegać
              opodatkowaniu zgodnie z obowiązującymi przepisami prawa podatkowego.
              Organizator poinformuje Uczestnika o ewentualnych obowiązkach
              podatkowych.
            </li>
          </ol>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 7. Treści przesyłane przez Uczestników
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Przesyłając zdjęcia lub inne materiały w ramach misji, Uczestnik
              oświadcza, że posiada do nich prawa autorskie lub uzyskał zgodę
              uprawnionego podmiotu na ich udostępnienie.
            </li>
            <li>
              Uczestnik udziela Organizatorowi niewyłącznej, nieodpłatnej,
              nieograniczonej terytorialnie licencji na korzystanie z przesłanych
              materiałów w celach związanych z działalnością Aplikacji i Fundacji,
              w szczególności na polach eksploatacji: utrwalanie, zwielokrotnianie
              cyfrowe, publiczne udostępnianie w Internecie.
            </li>
            <li>
              Zabronione jest przesyłanie treści: naruszających prawo, obscenicznych,
              obraźliwych, promujących nienawiść, zawierających dane osobowe osób
              trzecich bez ich zgody lub naruszających prawa własności intelektualnej.
            </li>
            <li>
              Organizator zastrzega sobie prawo do moderacji, odmowy akceptacji
              lub usunięcia treści naruszających prawo, dobre obyczaje lub niniejszy
              Regulamin — bez konieczności uzasadnienia.
            </li>
          </ol>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 8. Zasady fair play i zakaz nadużyć
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Zabrania się w szczególności: tworzenia wielu kont przez jedną osobę,
              stosowania botów, skryptów automatyzujących lub innych narzędzi
              pozwalających na nieuczciwe zdobywanie XP, manipulowania wynikami
              bitew, celowego wykorzystywania błędów Aplikacji (tzw. exploitów).
            </li>
            <li>
              Organizator ma prawo zawiesić lub trwale usunąć Konto Uczestnika
              naruszającego powyższe zasady. W uzasadnionych przypadkach
              zawieszenie może nastąpić bez uprzedniego ostrzeżenia.
            </li>
            <li>
              Uczestnikowi przysługuje prawo odwołania się od decyzji o zawieszeniu
              Konta — odwołanie należy przesłać na adres:{' '}
              <span className="text-turbo-400">kontakt@turbopomoc.pl</span>{' '}
              w terminie 14 dni od zawieszenia.
            </li>
          </ol>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 9. Odpowiedzialność Organizatora
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizator dokłada należytej staranności w utrzymaniu prawidłowego
              działania Aplikacji, lecz nie gwarantuje jej nieprzerwanego
              i wolnego od błędów funkcjonowania.
            </li>
            <li>
              Organizator nie ponosi odpowiedzialności za: przerwy w działaniu
              Aplikacji wynikające z przyczyn technicznych lub siły wyższej,
              utratę danych spowodowaną działaniem Uczestnika, szkody wynikłe
              z nieprawidłowego korzystania z Aplikacji.
            </li>
            <li>
              W przypadku planowanych przerw technicznych Organizator dołoży
              starań, aby poinformować Uczestników z odpowiednim wyprzedzeniem.
            </li>
          </ol>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 10. Reklamacje
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Reklamacje dotyczące funkcjonowania Aplikacji można składać drogą
              elektroniczną na adres:{' '}
              <span className="text-turbo-400">kontakt@turbopomoc.pl</span>.
            </li>
            <li>
              Reklamacja powinna zawierać: nick lub adres e-mail Uczestnika, opis
              problemu oraz oczekiwany sposób rozwiązania.
            </li>
            <li>
              Organizator rozpatruje reklamacje w terminie 14 dni od dnia ich
              otrzymania i informuje Uczestnika o sposobie rozpatrzenia drogą
              elektroniczną.
            </li>
          </ol>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 11. Usunięcie Konta
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Uczestnik może w każdym momencie zrezygnować z korzystania z Aplikacji
              i zażądać usunięcia Konta, przesyłając stosowne żądanie na adres:{' '}
              <span className="text-turbo-400">kontakt@turbopomoc.pl</span>.
            </li>
            <li>
              Usunięcie Konta jest równoznaczne z utratą zgromadzonych XP, Kart,
              wyników bitew i pozostałych danych związanych z grą. Operacja jest
              nieodwracalna.
            </li>
            <li>
              Dane osobowe po usunięciu Konta są przetwarzane zgodnie z Polityką
              prywatności.
            </li>
          </ol>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 12. Zmiany Regulaminu
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizator zastrzega sobie prawo do zmiany niniejszego Regulaminu
              z ważnych przyczyn, w szczególności: zmian przepisów prawa,
              wprowadzenia nowych funkcjonalności Aplikacji, zmian organizacyjnych
              po stronie Organizatora.
            </li>
            <li>
              O planowanych zmianach Regulaminu Uczestnicy zostaną powiadomieni
              w Aplikacji co najmniej 14 dni przed wejściem zmian w życie.
            </li>
            <li>
              Dalsze korzystanie z Aplikacji po wejściu w życie nowego Regulaminu
              oznacza jego akceptację. Uczestnik, który nie akceptuje zmian, może
              usunąć Konto zgodnie z &sect; 11.
            </li>
          </ol>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 13. Postanowienia końcowe
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają
              przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy
              o świadczeniu usług drogą elektroniczną oraz RODO.
            </li>
            <li>
              Ewentualne spory wynikłe z korzystania z Aplikacji będą rozstrzygane
              przez sąd właściwy dla siedziby Organizatora, z zastrzeżeniem
              uprawnień konsumentów wynikających z przepisów prawa.
            </li>
            <li>
              Regulamin wchodzi w życie z dniem 14 lutego 2026 r.
            </li>
          </ol>
        </section>

        {/* Kontakt */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Kontakt</h2>
          <div className="p-4 bg-surface-2 rounded-xl border border-dark-600 space-y-1">
            <p className="text-white font-medium">Fundacja Turbo Pomoc</p>
            <p>ul. Wadowicka 165, 34-120 Inwałd</p>
            <p>NIP: 5512648557 | KRS: 0000892001</p>
            <p>
              E-mail:{' '}
              <a href="mailto:kontakt@turbopomoc.pl" className="text-turbo-400 hover:underline">
                kontakt@turbopomoc.pl
              </a>
            </p>
          </div>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-dark-700">
        <p className="text-dark-500 text-xs text-center">
          &copy; 2026 Fundacja Turbo Pomoc. Wszelkie prawa zastrzeżone.
        </p>
      </div>
    </div>
  );
}
