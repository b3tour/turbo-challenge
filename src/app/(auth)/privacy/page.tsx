'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-dark-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-1" />
        Powrót
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Polityka prywatności</h1>
      <p className="text-dark-400 text-sm mb-8">
        Polityka prywatności aplikacji Turbo Challenge. Wersja 1.0 z dnia 14.02.2026 r.
      </p>

      <div className="space-y-8 text-dark-300 text-sm leading-relaxed">
        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 1. Administrator danych osobowych
          </h2>
          <p>
            Administratorem danych osobowych przetwarzanych w związku z korzystaniem
            z aplikacji Turbo Challenge jest:
          </p>
          <div className="mt-3 p-4 bg-surface-2 rounded-xl border border-dark-600 space-y-1">
            <p className="text-white font-medium">Fundacja Turbo Pomoc</p>
            <p>ul. Wadowicka 165, 34-120 Inwałd</p>
            <p>NIP: 5512648557 | REGON: 388616737 | KRS: 0000892001</p>
            <p>
              E-mail:{' '}
              <a href="mailto:kontakt@turbopomoc.pl" className="text-turbo-400 hover:underline">
                kontakt@turbopomoc.pl
              </a>
            </p>
          </div>
          <p className="mt-3">
            W sprawach dotyczących ochrony danych osobowych prosimy o kontakt
            na powyższy adres e-mail z dopiskiem &quot;Ochrona danych osobowych&quot;.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 2. Podstawy prawne przetwarzania
          </h2>
          <p className="mb-3">
            Dane osobowe przetwarzamy na podstawie Rozporządzenia Parlamentu
            Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie
            ochrony osób fizycznych w związku z przetwarzaniem danych osobowych
            i w sprawie swobodnego przepływu takich danych (RODO) oraz ustawy z dnia
            10 maja 2018 r. o ochronie danych osobowych.
          </p>
          <p>W zależności od kategorii danych stosujemy następujące podstawy prawne:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong className="text-white">Art. 6 ust. 1 lit. a RODO (zgoda)</strong> —
              numer telefonu, zdjęcie profilowe, dane lokalizacyjne GPS
            </li>
            <li>
              <strong className="text-white">Art. 6 ust. 1 lit. b RODO (umowa)</strong> —
              dane niezbędne do świadczenia usługi: e-mail, nick, hasło, postępy
              w grze, dane transakcyjne (zakup kart)
            </li>
            <li>
              <strong className="text-white">Art. 6 ust. 1 lit. c RODO (obowiązek prawny)</strong> —
              dane wymagane przepisami podatkowymi i rachunkowymi (dokumentacja
              darowizn)
            </li>
            <li>
              <strong className="text-white">Art. 6 ust. 1 lit. f RODO (uzasadniony interes)</strong> —
              zapewnienie bezpieczeństwa Aplikacji, przeciwdziałanie nadużyciom,
              dochodzenie roszczeń
            </li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 3. Zakres i cele przetwarzania danych
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="py-2 pr-4 text-white font-medium">Kategoria danych</th>
                  <th className="py-2 pr-4 text-white font-medium">Cel przetwarzania</th>
                  <th className="py-2 text-white font-medium">Obowiązkowe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                <tr>
                  <td className="py-2 pr-4">Adres e-mail</td>
                  <td className="py-2 pr-4">Rejestracja, logowanie, kontakt</td>
                  <td className="py-2">Tak</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Hasło</td>
                  <td className="py-2 pr-4">Uwierzytelnianie (przechowywane w formie zahashowanej)</td>
                  <td className="py-2">Tak</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Nick (pseudonim)</td>
                  <td className="py-2 pr-4">Identyfikacja w grze, rankingi, bitwy PvP</td>
                  <td className="py-2">Tak</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Numer telefonu</td>
                  <td className="py-2 pr-4">Kontakt w sprawie nagród</td>
                  <td className="py-2">Nie</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Zdjęcie profilowe (avatar)</td>
                  <td className="py-2 pr-4">Personalizacja profilu</td>
                  <td className="py-2">Nie</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Zdjęcia z misji</td>
                  <td className="py-2 pr-4">Weryfikacja wykonania misji fotograficznych</td>
                  <td className="py-2">Zależne od misji</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Dane lokalizacyjne (GPS)</td>
                  <td className="py-2 pr-4">Weryfikacja misji z lokalizacją</td>
                  <td className="py-2">Zależne od misji</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Postępy w grze (XP, poziom, karty)</td>
                  <td className="py-2 pr-4">Funkcjonowanie mechanik gry, rankingi</td>
                  <td className="py-2">Tak (automatyczne)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Dane transakcyjne</td>
                  <td className="py-2 pr-4">Realizacja i ewidencja darowizn (zakup kart)</td>
                  <td className="py-2">Przy zakupie</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Data akceptacji regulaminu</td>
                  <td className="py-2 pr-4">Dokumentowanie zgody</td>
                  <td className="py-2">Tak (automatyczne)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 4. Odbiorcy danych — podmioty przetwarzające
          </h2>
          <p className="mb-3">
            W celu świadczenia usług Aplikacji korzystamy z usług następujących
            podmiotów trzecich (procesorów danych):
          </p>
          <ol className="list-decimal list-inside space-y-3">
            <li>
              <strong className="text-white">Supabase Inc.</strong> (San Francisco, USA) —
              baza danych, autoryzacja, przechowywanie plików. Dane przechowywane
              na serwerach w regionie EU (Frankfurt am Main, Niemcy). Przetwarzanie
              na podstawie Standardowych Klauzul Umownych (SCC) zatwierdonych decyzją
              Komisji Europejskiej, zgodnie z art. 46 ust. 2 lit. c RODO.
            </li>
            <li>
              <strong className="text-white">Vercel Inc.</strong> (San Francisco, USA) —
              hosting aplikacji webowej. Serwery w regionie EU (Frankfurt am Main,
              Niemcy). Przetwarzanie na podstawie SCC.
            </li>
            <li>
              <strong className="text-white">Google LLC</strong> (Mountain View, USA) —
              wyłącznie w przypadku logowania przez Google OAuth. Przetwarzanie
              zgodnie z polityką prywatności Google i na podstawie SCC. Zakres
              udostępnianych danych: adres e-mail i nazwa profilu Google.
            </li>
          </ol>
          <p className="mt-3">
            Dane osobowe nie są sprzedawane, wypożyczane ani udostępniane podmiotom
            trzecim w celach marketingowych. Nie profilujemy użytkowników w celach
            reklamowych.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 5. Przekazywanie danych poza Europejski Obszar Gospodarczy
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Podmioty wymienione w &sect; 4 (Supabase, Vercel, Google) mają
              siedziby w Stanach Zjednoczonych, jednak dane przetwarzane są
              na serwerach zlokalizowanych na terenie Unii Europejskiej (region
              Frankfurt).
            </li>
            <li>
              W przypadku gdy dane są transferowane poza EOG (np. w ramach wsparcia
              technicznego), transfer odbywa się na podstawie Standardowych Klauzul
              Umownych (SCC) zgodnych z decyzją wykonawczą Komisji Europejskiej
              z dnia 4 czerwca 2021 r. (2021/914).
            </li>
            <li>
              Administrator na bieżąco weryfikuje, czy podmioty przetwarzające
              zapewniają odpowiedni poziom ochrony danych osobowych.
            </li>
          </ol>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 6. Okres przechowywania danych
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Dane konta (e-mail, nick, postępy w grze) przechowywane są przez
              cały okres posiadania aktywnego Konta w Aplikacji.
            </li>
            <li>
              Po usunięciu Konta dane osobowe są usuwane w ciągu 30 dni,
              z wyjątkiem:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>
                  danych wymaganych przepisami prawa podatkowego i rachunkowego
                  (dokumentacja darowizn) — przechowywanych przez okres 5 lat od końca
                  roku podatkowego, w którym dokonano darowizny
                </li>
                <li>
                  danych niezbędnych do dochodzenia roszczeń — przechowywanych do czasu
                  przedawnienia roszczenia (maksymalnie 6 lat zgodnie z art. 118 KC)
                </li>
              </ul>
            </li>
            <li>
              Zdjęcia przesłane w ramach misji są usuwane wraz z usunięciem Konta.
            </li>
          </ol>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 7. Prawa osób, których dane dotyczą
          </h2>
          <p className="mb-3">
            Zgodnie z RODO przysługują Ci następujące prawa:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-turbo-400 mt-0.5">a)</span>
              <span>
                <strong className="text-white">Prawo dostępu</strong> (art. 15 RODO) —
                możesz uzyskać informację o tym, jakie Twoje dane przetwarzamy
                i otrzymać ich kopię.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-turbo-400 mt-0.5">b)</span>
              <span>
                <strong className="text-white">Prawo do sprostowania</strong> (art. 16 RODO) —
                możesz żądać poprawienia nieprawidłowych lub uzupełnienia niekompletnych
                danych.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-turbo-400 mt-0.5">c)</span>
              <span>
                <strong className="text-white">Prawo do usunięcia</strong> (art. 17 RODO) —
                możesz żądać usunięcia swoich danych (&quot;prawo do bycia zapomnianym&quot;),
                gdy nie ma podstawy prawnej do dalszego przetwarzania.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-turbo-400 mt-0.5">d)</span>
              <span>
                <strong className="text-white">Prawo do ograniczenia przetwarzania</strong>{' '}
                (art. 18 RODO) — możesz żądać ograniczenia przetwarzania w określonych
                sytuacjach.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-turbo-400 mt-0.5">e)</span>
              <span>
                <strong className="text-white">Prawo do przenoszenia danych</strong>{' '}
                (art. 20 RODO) — możesz otrzymać swoje dane w ustrukturyzowanym formacie
                (JSON/CSV) i przekazać je innemu administratorowi.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-turbo-400 mt-0.5">f)</span>
              <span>
                <strong className="text-white">Prawo sprzeciwu</strong> (art. 21 RODO) —
                możesz wnieść sprzeciw wobec przetwarzania opartego na uzasadnionym
                interesie Administratora.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-turbo-400 mt-0.5">g)</span>
              <span>
                <strong className="text-white">Prawo do cofnięcia zgody</strong> —
                w przypadkach gdy przetwarzanie opiera się na zgodzie, możesz ją
                cofnąć w dowolnym momencie. Cofnięcie zgody nie wpływa na zgodność
                z prawem przetwarzania dokonanego przed jej cofnięciem.
              </span>
            </li>
          </ul>
          <p className="mt-3">
            Aby skorzystać z powyższych praw, skontaktuj się z nami:{' '}
            <a href="mailto:kontakt@turbopomoc.pl" className="text-turbo-400 hover:underline">
              kontakt@turbopomoc.pl
            </a>{' '}
            z dopiskiem &quot;Ochrona danych osobowych&quot;. Odpowiemy w terminie
            30 dni od otrzymania żądania.
          </p>
          <p className="mt-2">
            Masz również prawo złożenia skargi do organu nadzorczego — Prezesa
            Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa,{' '}
            <span className="text-turbo-400">uodo.gov.pl</span>.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 8. Pliki cookies i dane techniczne
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Aplikacja wykorzystuje pliki cookies wyłącznie w celu utrzymania sesji
              logowania użytkownika (cookies techniczne/niezbędne w rozumieniu
              art. 173 ustawy Prawo telekomunikacyjne).
            </li>
            <li>
              Nie stosujemy cookies marketingowych, analitycznych ani profilujących.
              Nie korzystamy z narzędzi śledzących firm trzecich (np. Google Analytics,
              Facebook Pixel).
            </li>
            <li>
              Cookies sesyjne są automatycznie usuwane po zakończeniu sesji
              lub po upływie okresu ważności tokena uwierzytelniającego.
            </li>
            <li>
              Podstawą stosowania cookies niezbędnych jest art. 6 ust. 1 lit. f RODO
              (uzasadniony interes — zapewnienie prawidłowego działania Aplikacji).
              Zgoda użytkownika nie jest wymagana dla cookies ściśle niezbędnych
              zgodnie z art. 173 ust. 3 Prawa telekomunikacyjnego.
            </li>
          </ol>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 9. Bezpieczeństwo danych
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Komunikacja z Aplikacją odbywa się wyłącznie przez szyfrowane
              połączenie TLS/HTTPS.
            </li>
            <li>
              Hasła użytkowników są przechowywane w formie zahashowanej
              z wykorzystaniem algorytmu bcrypt. Administrator nie ma dostępu
              do haseł w formie jawnej.
            </li>
            <li>
              Dostęp do bazy danych jest chroniony przez mechanizm Row Level
              Security (RLS) — użytkownicy mają dostęp wyłącznie do własnych
              danych, zgodnie z zasadą minimalizacji uprawnień.
            </li>
            <li>
              Autoryzacja oparta jest na protokole PKCE (Proof Key for Code
              Exchange), zapewniającym bezpieczeństwo przepływu OAuth 2.0.
            </li>
            <li>
              Administrator stosuje odpowiednie środki techniczne
              i organizacyjne w celu ochrony danych osobowych przed
              nieuprawnionym dostępem, utratą lub zniszczeniem, zgodnie
              z art. 32 RODO.
            </li>
          </ol>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 10. Zautomatyzowane podejmowanie decyzji
          </h2>
          <p>
            Aplikacja nie podejmuje decyzji opartych wyłącznie na zautomatyzowanym
            przetwarzaniu, w tym profilowaniu, które wywoływałyby skutki prawne
            lub w podobny sposób istotnie wpływały na Uczestnika (art. 22 RODO).
            Wszelkie mechaniki gry (przyznawanie XP, wyniki bitew, rankingi)
            mają charakter wyłącznie rozrywkowy.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 11. Przetwarzanie danych osób niepełnoletnich
          </h2>
          <p>
            Aplikacja jest przeznaczona dla osób, które ukończyły 16 lat, zgodnie
            z art. 8 ust. 1 RODO w związku z art. 2 pkt 1 polskiej ustawy o ochronie
            danych osobowych z dnia 10 maja 2018 r. Osoby w wieku 16–17 lat mogą
            korzystać z Aplikacji wyłącznie za zgodą rodzica lub opiekuna prawnego.
            Administrator nie zbiera świadomie danych osób poniżej 16. roku życia.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            &sect; 12. Zmiany Polityki prywatności
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Administrator zastrzega sobie prawo do zmian niniejszej Polityki
              prywatności w przypadku zmian przepisów prawa, zmian w zakresie
              przetwarzanych danych lub zmian technologicznych.
            </li>
            <li>
              O istotnych zmianach użytkownicy zostaną powiadomieni w Aplikacji
              co najmniej 14 dni przed wejściem zmian w życie.
            </li>
            <li>
              Aktualna wersja Polityki prywatności jest zawsze dostępna w Aplikacji
              (zakładka Profil {'->'} Informacje prawne) oraz pod adresem /privacy.
            </li>
          </ol>
        </section>

        {/* Kontakt */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Kontakt</h2>
          <div className="p-4 bg-surface-2 rounded-xl border border-dark-600 space-y-1">
            <p className="text-white font-medium">Fundacja Turbo Pomoc</p>
            <p>ul. Wadowicka 165, 34-120 Inwałd</p>
            <p>NIP: 5512648557 | REGON: 388616737 | KRS: 0000892001</p>
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
