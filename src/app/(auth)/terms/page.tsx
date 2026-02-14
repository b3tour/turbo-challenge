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
        Turbo Challenge — aplikacja Fundacji Turbo Pomoc. Ostatnia aktualizacja: 14.02.2026
      </p>

      <div className="space-y-8 text-dark-300 text-sm leading-relaxed">
        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Postanowienia ogolne</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizatorem aplikacji Turbo Challenge (dalej: &quot;Aplikacja&quot;) jest Fundacja
              Turbo Pomoc z siedziba w [adres fundacji], wpisana do KRS pod numerem [numer KRS]
              (dalej: &quot;Organizator&quot;).
            </li>
            <li>
              Aplikacja ma charakter grywalizacyjny i sluzy popularyzacji celów statutowych
              Fundacji Turbo Pomoc oraz zbieraniu srodkow na cele charytatywne.
            </li>
            <li>
              Korzystanie z Aplikacji jest dobrowolne i wymaga akceptacji niniejszego Regulaminu.
            </li>
          </ol>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Warunki uczestnictwa</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Uczesnikiem moze zostac kazda osoba fizyczna, ktora ukonczyla 13 lat. Osoby
              niepelnoletnie (13-17 lat) potrzebuja zgody opiekuna prawnego.
            </li>
            <li>
              Rejestracja wymaga podania adresu email oraz utworzenia nicku (pseudonimu). Numer
              telefonu jest opcjonalny i sluzy wylacznie do kontaktu w sprawie nagrod.
            </li>
            <li>Kazdy uczestnik moze posiadac tylko jedno konto.</li>
            <li>
              Rejestracja mozliwa jest przez formularz (email + haslo) lub za posrednictwem konta
              Google.
            </li>
          </ol>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Zasady gry</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Uczestnicy zdobywaja punkty doswiadczenia (XP) poprzez realizacje misji roznych
              typow: skanowanie kodów QR, przesylanie zdjec, rozwiazywanie quizów, weryfikacje GPS
              oraz zadania manualne.
            </li>
            <li>
              XP sluzy do awansowania na kolejne poziomy, udzialu w tuningu samochodów oraz
              rywalizacji w rankingach.
            </li>
            <li>
              Uczestnicy moga zbierac wirtualne karty samochodów o roznych rzadkosciach (common,
              rare, epic, legendary) oraz brac udzial w bitwach PvP (Turbo Bitwy).
            </li>
            <li>
              Organizator zastrzega sobie prawo do modyfikacji zasad gry, wartosci XP, dostepnosci
              misji oraz mechanik rozgrywki.
            </li>
          </ol>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Nagrody</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizator moze przyznawac nagrody rzeczowe lub inne swiadczenia uczestnikom
              spelniajacym okreslone kryteria (np. pozycja w rankingu, ukonczenie zestawu misji).
            </li>
            <li>
              Szczegolowe zasady przyznawania nagrod, ich rodzaj oraz warunki odbioru beda
              ogloszone przez Organizatora w Aplikacji.
            </li>
            <li>
              Nagrody nie podlegaja zamianie na ekwiwalent pieniezny, chyba ze Organizator
              postanowi inaczej.
            </li>
            <li>
              Odbiór nagrod moze wymagac podania danych osobowych (imie, nazwisko, adres) oraz
              kontaktu telefonicznego.
            </li>
          </ol>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Zakup kart i darowizny</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Uczestnicy moga kupowac karty samochodów. Srodki z zakupu kart stanowia darowizne na
              rzecz Fundacji Turbo Pomoc i sa przeznaczane na cele statutowe.
            </li>
            <li>
              Zakup kart ma charakter darowizny i nie podlega zwrotowi, chyba ze obowiazujace
              przepisy prawa stanowia inaczej.
            </li>
            <li>
              Karty zakupione nie stanowia wartosci pienieznej i nie moga byc przedmiotem handlu
              poza Aplikacja.
            </li>
          </ol>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            6. Tresci przesylane przez uzytkowników
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Przesylajac zdjecia w ramach misji, uczestnik oswiadcza, ze posiada prawa autorskie
              do przesylanej tresci lub ma zgode wlasciciela praw.
            </li>
            <li>
              Uczestnik udziela Organizatorowi nieodplatnej licencji na wykorzystanie przeslanych
              zdjec w celach zwiazanych z dzialalnością Aplikacji i Fundacji.
            </li>
            <li>
              Organizator zastrzega sobie prawo do moderacji i usuwania tresci naruszajacych prawo,
              dobre obyczaje lub niniejszy Regulamin.
            </li>
          </ol>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Zasady fair play</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Zabrania sie: tworzenia wielu kont, stosowania botów lub automatycznych skryptów,
              manipulowania wynikami bitew, wykorzystywania bledów Aplikacji.
            </li>
            <li>
              Organizator ma prawo zawiesic lub usunac konto uczestnika naruszajacego zasady bez
              uprzedniego ostrzezenia.
            </li>
          </ol>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Odpowiedzialnosc</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizator doklada starannosci w utrzymaniu dzialania Aplikacji, ale nie gwarantuje
              jej nieprzerwanego i wolnego od bledów funkcjonowania.
            </li>
            <li>
              Organizator nie ponosi odpowiedzialnosci za szkody wynikle z nieprawidlowego
              korzystania z Aplikacji przez uzytkownika.
            </li>
          </ol>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Zmiany regulaminu</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Organizator zastrzega sobie prawo do zmiany Regulaminu. O zmianach uczestnicy
              zostaną powiadomieni w Aplikacji.
            </li>
            <li>
              Kontynuowanie korzystania z Aplikacji po zmianie Regulaminu oznacza akceptacje nowych
              warunkow.
            </li>
          </ol>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">10. Kontakt</h2>
          <p>
            Wszelkie pytania dotyczace Regulaminu lub Aplikacji prosimy kierowac na adres:{' '}
            <span className="text-turbo-400">[email fundacji]</span> lub przez formularz kontaktowy
            na stronie Fundacji Turbo Pomoc.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-dark-700">
        <p className="text-dark-500 text-xs text-center">
          Fundacja Turbo Pomoc &mdash; Turbo Challenge 2026
        </p>
      </div>
    </div>
  );
}
