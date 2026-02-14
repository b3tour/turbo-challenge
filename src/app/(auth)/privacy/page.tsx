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

      <h1 className="text-2xl font-bold text-white mb-2">Polityka prywatnosci</h1>
      <p className="text-dark-400 text-sm mb-8">
        Turbo Challenge — aplikacja Fundacji Turbo Pomoc. Ostatnia aktualizacja: 14.02.2026
      </p>

      <div className="space-y-8 text-dark-300 text-sm leading-relaxed">
        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Administrator danych</h2>
          <p>
            Administratorem danych osobowych jest Fundacja Turbo Pomoc z siedziba w [adres
            fundacji], wpisana do KRS pod numerem [numer KRS] (dalej: &quot;Administrator&quot;).
          </p>
          <p className="mt-2">
            Kontakt w sprawach ochrony danych:{' '}
            <span className="text-turbo-400">[email kontaktowy]</span>
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            2. Jakie dane zbieramy i w jakim celu
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="py-2 pr-4 text-white font-medium">Dane</th>
                  <th className="py-2 pr-4 text-white font-medium">Cel</th>
                  <th className="py-2 text-white font-medium">Podstawa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                <tr>
                  <td className="py-2 pr-4">Adres email</td>
                  <td className="py-2 pr-4">Rejestracja, logowanie, kontakt</td>
                  <td className="py-2">Umowa (art. 6 ust. 1 lit. b RODO)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Nick (pseudonim)</td>
                  <td className="py-2 pr-4">Identyfikacja w grze, rankingi</td>
                  <td className="py-2">Umowa</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Numer telefonu</td>
                  <td className="py-2 pr-4">Kontakt ws. nagrod (opcjonalnie)</td>
                  <td className="py-2">Zgoda (art. 6 ust. 1 lit. a RODO)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Zdjecie profilowe</td>
                  <td className="py-2 pr-4">Personalizacja profilu</td>
                  <td className="py-2">Zgoda</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Zdjecia z misji</td>
                  <td className="py-2 pr-4">Weryfikacja wykonania misji</td>
                  <td className="py-2">Umowa</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Dane lokalizacyjne (GPS)</td>
                  <td className="py-2 pr-4">Weryfikacja misji GPS</td>
                  <td className="py-2">Zgoda (jednorazowa, w przegladarce)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Postepy w grze (XP, poziom)</td>
                  <td className="py-2 pr-4">Funkcjonowanie gry, rankingi</td>
                  <td className="py-2">Umowa</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Dane transakcyjne</td>
                  <td className="py-2 pr-4">Realizacja zakupu kart (darowizny)</td>
                  <td className="py-2">Umowa</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            3. Udostepnianie danych podmiotom trzecim
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong className="text-white">Supabase Inc.</strong> — hostowanie bazy danych,
              autoryzacja, przechowywanie plikow. Serwery w regionie EU (Frankfurt). Supabase
              dziala jako podmiot przetwarzajacy (procesor) na podstawie umowy powierzenia danych.
            </li>
            <li>
              <strong className="text-white">Vercel Inc.</strong> — hosting aplikacji webowej.
              Serwery w regionie EU (Frankfurt).
            </li>
            <li>
              <strong className="text-white">Google LLC</strong> — w przypadku logowania przez
              Google OAuth. Przetwarzanie zgodnie z polityka prywatnosci Google.
            </li>
          </ol>
          <p className="mt-2">
            Dane nie sa sprzedawane ani udostepniane podmiotom trzecim w celach marketingowych.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Okres przechowywania danych</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Dane konta sa przechowywane przez caly okres korzystania z Aplikacji.</li>
            <li>
              Po usunieciu konta dane sa usuwane w ciagu 30 dni, z wyjatkiem danych wymaganych
              przepisami prawa (np. dokumentacja darowizn).
            </li>
            <li>
              Logi systemowe i dane analityczne sa anonimizowane po 12 miesiacach.
            </li>
          </ol>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Prawa uzytkownika</h2>
          <p className="mb-2">Zgodnie z RODO, masz prawo do:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Dostepu do swoich danych osobowych</li>
            <li>Sprostowania (poprawienia) danych</li>
            <li>Usuniecia danych (&quot;prawo do bycia zapomnianym&quot;)</li>
            <li>Ograniczenia przetwarzania</li>
            <li>Przenoszenia danych</li>
            <li>Sprzeciwu wobec przetwarzania</li>
            <li>Cofniecia zgody (jesli przetwarzanie opiera sie na zgodzie)</li>
          </ul>
          <p className="mt-2">
            Aby skorzystac z powyzszych praw, skontaktuj sie z nami:{' '}
            <span className="text-turbo-400">[email kontaktowy]</span>
          </p>
          <p className="mt-2">
            Masz rowniez prawo zlozenia skargi do organu nadzorczego — Prezesa Urzedu Ochrony
            Danych Osobowych (PUODO).
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Pliki cookies</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Aplikacja wykorzystuje pliki cookies wylacznie w celu utrzymania sesji logowania
              (cookies techniczne/niezbedne).
            </li>
            <li>Nie stosujemy cookies marketingowych ani analitycznych firm trzecich.</li>
            <li>
              Cookies sesyjne sa automatycznie usuwane po zakonczeniu sesji lub po uplywie okresu
              waznosci tokena.
            </li>
          </ol>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            7. Bezpieczenstwo danych
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Dane sa przesylane z uzyciem szyfrowania TLS (HTTPS).
            </li>
            <li>
              Hasla sa hashowane — Administrator nie ma dostepu do hasel w formie jawnej.
            </li>
            <li>
              Dostep do bazy danych jest chroniony przez Row Level Security (RLS) — uzytkownicy
              maja dostep wylacznie do wlasnych danych.
            </li>
          </ol>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">
            8. Zmiany polityki prywatnosci
          </h2>
          <p>
            Administrator zastrzega sobie prawo do zmian niniejszej Polityki prywatnosci.
            O istotnych zmianach uzytkownicy zostana powiadomieni w Aplikacji. Aktualna wersja
            jest zawsze dostepna pod adresem{' '}
            <span className="text-turbo-400">/privacy</span>.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Kontakt</h2>
          <p>
            W sprawach dotyczacych ochrony danych osobowych prosimy o kontakt:{' '}
            <span className="text-turbo-400">[email kontaktowy]</span>
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
