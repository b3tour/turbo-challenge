-- Turbo Challenge - Karty Samochodów PACK 2
-- Duża paczka ~100 nowych kart
-- Użycie: Wykonaj w Supabase SQL Editor

INSERT INTO cards (
  name, description, card_type, rarity, category, points, is_active, is_purchasable,
  car_brand, car_model, car_horsepower, car_torque, car_max_speed, car_year,
  car_engine, car_cylinders, car_acceleration, car_weight, car_drivetrain, car_fun_fact
) VALUES

-- ===========================================
-- LEGENDARY - Więcej hipercarów (10 kart)
-- ===========================================

-- Bugatti Veyron
(
  'Bugatti Veyron',
  'Auto które zmieniło definicję prędkości. Pierwszy seryjny samochód przekraczający 400 km/h.',
  'car', 'legendary', 'Bugatti', 1001, true, false,
  'Bugatti', 'Veyron 16.4', 1001, 1250, 407, 2005,
  '8.0L W16 Quad Turbo', 16, 2.5, 1888, 'AWD',
  'Kosztował 1.2 mln euro, a Bugatti traciło 6 mln na każdym sprzedanym egzemplarzu'
),

-- Rimac Nevera
(
  'Rimac Nevera',
  'Chorwacki elektryczny hypercar. Najszybszy samochód elektryczny na świecie.',
  'car', 'legendary', 'Rimac', 1914, true, false,
  'Rimac', 'Nevera', 1914, 2360, 412, 2021,
  '4x Silnik elektryczny', 0, 1.85, 2150, 'AWD',
  'Przyspieszenie 0-100 km/h w 1.85s - szybciej niż bolid F1'
),

-- SSC Tuatara
(
  'SSC Tuatara',
  'Amerykański hypercar zaprojektowany do pobicia rekordu prędkości.',
  'car', 'legendary', 'SSC', 1750, true, false,
  'SSC', 'Tuatara', 1750, 1735, 460, 2020,
  '5.9L V8 Twin Turbo', 8, 2.5, 1247, 'RWD',
  'Nazwa pochodzi od nowozelandzkiej jaszczurki tuatara'
),

-- Ferrari SF90 Stradale
(
  'Ferrari SF90 Stradale',
  'Pierwszy plug-in hybrid Ferrari. Łączy silnik V8 z trzema silnikami elektrycznymi.',
  'car', 'legendary', 'Ferrari', 1000, true, false,
  'Ferrari', 'SF90 Stradale', 1000, 800, 340, 2019,
  '4.0L V8 Twin Turbo + 3x Elektryczny', 8, 2.5, 1570, 'AWD',
  'SF90 oznacza 90. rocznicę Scuderia Ferrari'
),

-- Lamborghini Sián
(
  'Lamborghini Sián',
  'Pierwszy hybrydowy Lamborghini z superkondensatorem zamiast baterii.',
  'car', 'legendary', 'Lamborghini', 819, true, false,
  'Lamborghini', 'Sián FKP 37', 819, 720, 350, 2020,
  '6.5L V12 + Superkondensator', 12, 2.8, 1525, 'AWD',
  'FKP 37 to hołd dla założyciela - Ferdinand K. Piëch zmarł w wieku 37 lat pracy w VW'
),

-- Mercedes-AMG One
(
  'Mercedes-AMG One',
  'Silnik F1 w samochodzie drogowym. Technologia prosto z Formuły 1.',
  'car', 'legendary', 'Mercedes-AMG', 1063, true, false,
  'Mercedes-AMG', 'One', 1063, 0, 352, 2022,
  '1.6L V6 Turbo Hybrid (F1)', 6, 2.9, 1695, 'AWD',
  'Silnik musi się rozgrzewać jak w F1 - idle przy 3500 obr/min'
),

-- Gordon Murray T.50
(
  'Gordon Murray T.50',
  'Duchowy następca McLarena F1. Zaprojektowany przez tę samą legendę.',
  'car', 'legendary', 'Gordon Murray', 663, true, false,
  'Gordon Murray', 'T.50', 663, 467, 340, 2022,
  '3.9L V12 Cosworth', 12, 2.8, 986, 'RWD',
  'Wentylator z tyłu generuje dodatkowy docisk jak w Brabham BT46B z 1978'
),

-- Lotus Evija
(
  'Lotus Evija',
  'Pierwszy w pełni elektryczny Lotus. Brytyjski hypercar nowej ery.',
  'car', 'legendary', 'Lotus', 2000, true, false,
  'Lotus', 'Evija', 2000, 1700, 340, 2024,
  '4x Silnik elektryczny', 0, 2.8, 1680, 'AWD',
  'Limit produkcji: tylko 130 sztuk w cenie 2 mln funtów'
),

-- Aston Martin Valkyrie
(
  'Aston Martin Valkyrie',
  'Współpraca Astona z Red Bull Racing. Najbliżej F1 na drodze publicznej.',
  'car', 'legendary', 'Aston Martin', 1160, true, false,
  'Aston Martin', 'Valkyrie', 1160, 900, 402, 2021,
  '6.5L V12 Cosworth + KERS', 12, 2.5, 1130, 'RWD',
  'Projektował Adrian Newey - legendarny konstruktor bolidów F1'
),

-- Hennessey Venom F5
(
  'Hennessey Venom F5',
  'Teksański potwór zaprojektowany do przekroczenia 500 km/h.',
  'car', 'legendary', 'Hennessey', 1817, true, false,
  'Hennessey', 'Venom F5', 1817, 1617, 484, 2021,
  '6.6L V8 Twin Turbo Fury', 8, 2.6, 1360, 'RWD',
  'F5 oznacza najsilniejsze tornado w skali Fujity'
),

-- ===========================================
-- EPIC - Więcej supersamochodów (25 kart)
-- ===========================================

-- Ferrari F8 Tributo
(
  'Ferrari F8 Tributo',
  'Hołd dla najlepszego silnika V8 w historii Ferrari. Następca 488.',
  'car', 'epic', 'Ferrari', 720, true, false,
  'Ferrari', 'F8 Tributo', 720, 770, 340, 2019,
  '3.9L V8 Twin Turbo', 8, 2.9, 1435, 'RWD',
  'Tributo oznacza hołd dla silnika który 4 razy zdobył Engine of the Year'
),

-- Ferrari 296 GTB
(
  'Ferrari 296 GTB',
  'Pierwszy Ferrari z silnikiem V6 od czasów Dino. Hybryda nowej generacji.',
  'car', 'epic', 'Ferrari', 830, true, false,
  'Ferrari', '296 GTB', 830, 740, 330, 2022,
  '3.0L V6 Twin Turbo + Elektryczny', 6, 2.9, 1470, 'RWD',
  '296 = 2.9L silnik z 6 cylindrami'
),

-- Lamborghini Urus
(
  'Lamborghini Urus',
  'Pierwszy SUV Lamborghini od czasów LM002. Najszybszy SUV świata.',
  'car', 'epic', 'Lamborghini', 666, true, false,
  'Lamborghini', 'Urus Performante', 666, 850, 306, 2022,
  '4.0L V8 Twin Turbo', 8, 3.3, 2150, 'AWD',
  'Urus to nazwa dzikiego byka - przodka współczesnego bydła'
),

-- McLaren 765LT
(
  'McLaren 765LT',
  'Longtail - najostrzejsza wersja 720S. Stworzona na tor.',
  'car', 'epic', 'McLaren', 765, true, false,
  'McLaren', '765LT', 765, 800, 330, 2020,
  '4.0L V8 Twin Turbo', 8, 2.8, 1339, 'RWD',
  'LT = Long Tail, nawiązanie do kultowego F1 GTR Longtail'
),

-- McLaren Artura
(
  'McLaren Artura',
  'Pierwszy hybrydowy McLaren nowej generacji. Kompaktowy supercar.',
  'car', 'epic', 'McLaren', 680, true, false,
  'McLaren', 'Artura', 680, 720, 330, 2022,
  '3.0L V6 Twin Turbo + Elektryczny', 6, 3.0, 1498, 'RWD',
  'Całkowicie nowa platforma - lżejsza niż w 720S mimo hybrydy'
),

-- Porsche 911 GT3
(
  'Porsche 911 GT3',
  'Tor w DNA. Wolnossący silnik 4.0L który kręci się do 9000 obr/min.',
  'car', 'epic', 'Porsche', 510, true, false,
  'Porsche', '911 GT3 (992)', 510, 470, 318, 2021,
  '4.0L Boxer 6', 6, 3.4, 1435, 'RWD',
  'Silnik pochodzi bezpośrednio z wyścigowego 911 RSR'
),

-- Porsche 911 GT3 RS
(
  'Porsche 911 GT3 RS',
  'Najbardziej ekstremalne 911 w historii. Aktywna aerodynamika z DTM.',
  'car', 'epic', 'Porsche', 525, true, false,
  'Porsche', '911 GT3 RS (992)', 525, 465, 296, 2022,
  '4.0L Boxer 6', 6, 3.2, 1450, 'RWD',
  'Przy 285 km/h generuje 860 kg docisku - więcej niż waży!'
),

-- Porsche Taycan Turbo S
(
  'Porsche Taycan Turbo S',
  'Pierwszy elektryczny Porsche. Udowadnia że EV może być sportowe.',
  'car', 'epic', 'Porsche', 761, true, false,
  'Porsche', 'Taycan Turbo S', 761, 1050, 260, 2020,
  '2x Silnik elektryczny', 0, 2.8, 2295, 'AWD',
  'Może wykonywać launch control w nieskończoność bez przegrzania'
),

-- Mercedes-AMG GT Black Series
(
  'Mercedes-AMG GT Black Series',
  'Najostrzejszy AMG GT. Pobił rekord Nürburgringu wśród aut produkcyjnych.',
  'car', 'epic', 'Mercedes-AMG', 730, true, false,
  'Mercedes-AMG', 'GT Black Series', 730, 800, 325, 2020,
  '4.0L V8 Twin Turbo', 8, 3.2, 1642, 'RWD',
  'Flat-plane crankshaft jak w Ferrari daje lepszy dźwięk'
),

-- Audi e-tron GT RS
(
  'Audi e-tron GT RS',
  'Elektryczne RS. Dzieli platformę z Porsche Taycan.',
  'car', 'epic', 'Audi', 646, true, false,
  'Audi', 'e-tron GT RS', 646, 830, 250, 2021,
  '2x Silnik elektryczny', 0, 3.3, 2347, 'AWD',
  'W trybie boost chwilowo dostępne 830 Nm momentu'
),

-- Maserati MC20
(
  'Maserati MC20',
  'Powrót Maserati do supersamochodów. Nowy silnik Nettuno.',
  'car', 'epic', 'Maserati', 630, true, false,
  'Maserati', 'MC20', 630, 730, 325, 2020,
  '3.0L V6 Twin Turbo Nettuno', 6, 2.9, 1500, 'RWD',
  'Silnik Nettuno ma technologię F1 - dwa różne systemy spalania'
),

-- Bentley Continental GT Speed
(
  'Bentley Continental GT Speed',
  'Luksusowy grand tourer w najszybszej wersji. Brytyjska elegancja i moc.',
  'car', 'epic', 'Bentley', 659, true, false,
  'Bentley', 'Continental GT Speed', 659, 900, 335, 2021,
  '6.0L W12 Twin Turbo', 12, 3.5, 2273, 'AWD',
  'Wnętrze jest ręcznie szycie - zajmuje 110 godzin'
),

-- Ford GT
(
  'Ford GT',
  'Powrót legendy Le Mans. Amerykański supercar z włókna węglowego.',
  'car', 'epic', 'Ford', 660, true, false,
  'Ford', 'GT', 660, 746, 348, 2017,
  '3.5L V6 EcoBoost Twin Turbo', 6, 3.0, 1385, 'RWD',
  'Ford wybrał nabywców - trzeba było mieć CV motoryzacyjne'
),

-- Lotus Emira
(
  'Lotus Emira',
  'Ostatni spalinowy Lotus. Pożegnanie z tradycją w wielkim stylu.',
  'car', 'epic', 'Lotus', 400, true, false,
  'Lotus', 'Emira V6', 400, 430, 290, 2022,
  '3.5L V6 Supercharged (Toyota)', 6, 4.3, 1405, 'RWD',
  'Dostępna też z silnikiem AMG 4-cylindrowym'
),

-- Ferrari Purosangue
(
  'Ferrari Purosangue',
  'Pierwszy SUV w historii Ferrari. Cztery drzwi, cztery miejsca.',
  'car', 'epic', 'Ferrari', 725, true, false,
  'Ferrari', 'Purosangue', 725, 716, 310, 2022,
  '6.5L V12', 12, 3.3, 2033, 'AWD',
  'Purosangue = czystej krwi po włosku. Ferrari nie nazywa go SUV-em.'
),

-- Lamborghini Revuelto
(
  'Lamborghini Revuelto',
  'Następca Aventadora. Pierwszy hybrydowy V12 Lamborghini.',
  'car', 'epic', 'Lamborghini', 1015, true, false,
  'Lamborghini', 'Revuelto', 1015, 850, 350, 2023,
  '6.5L V12 + 3x Elektryczny', 12, 2.5, 1772, 'AWD',
  'Revuelto = scrambled po hiszpańsku - jak jajecznica'
),

-- Acura NSX Type S
(
  'Acura NSX Type S',
  'Finalna wersja drugiej generacji NSX. Pożegnanie z legendą.',
  'car', 'epic', 'Acura', 600, true, false,
  'Acura', 'NSX Type S', 600, 667, 307, 2022,
  '3.5L V6 Twin Turbo + 3x Elektryczny', 6, 2.9, 1725, 'AWD',
  'Produkowano tylko 350 sztuk Type S na cały świat'
),

-- BMW XM Label Red
(
  'BMW XM Label Red',
  'Najpotężniejsze BMW w historii. SUV z mocą supersamochodu.',
  'car', 'epic', 'BMW', 748, true, false,
  'BMW', 'XM Label Red', 748, 1000, 290, 2023,
  '4.4L V8 Twin Turbo + Elektryczny', 8, 3.8, 2785, 'AWD',
  'Jedyny model M projektowany od zera jako hybryda'
),

-- Porsche Carrera GT
(
  'Porsche Carrera GT',
  'Legendarny supercar z silnikiem z Le Mans. Ostatni wolnossący V10.',
  'car', 'epic', 'Porsche', 612, true, false,
  'Porsche', 'Carrera GT', 612, 590, 330, 2004,
  '5.7L V10', 10, 3.9, 1380, 'RWD',
  'Silnik pierwotnie projektowany dla prototypu LMP1'
),

-- Aston Martin DB11
(
  'Aston Martin DB11',
  'Elegancki grand tourer z nowym silnikiem V12.',
  'car', 'epic', 'Aston Martin', 639, true, false,
  'Aston Martin', 'DB11 V12', 639, 700, 334, 2016,
  '5.2L V12 Twin Turbo', 12, 3.7, 1770, 'RWD',
  'Pierwszy Aston z turbo w silniku V12'
),

-- Ferrari 812 Superfast
(
  'Ferrari 812 Superfast',
  'Najpotężniejszy wolnossący silnik V12 w historii Ferrari.',
  'car', 'epic', 'Ferrari', 800, true, false,
  'Ferrari', '812 Superfast', 800, 718, 340, 2017,
  '6.5L V12', 12, 2.9, 1630, 'RWD',
  'Silnik kręci się do 8500 obr/min - rekord wśród silników drogowych V12'
),

-- Lamborghini Huracán Tecnica
(
  'Lamborghini Huracán Tecnica',
  'Huracán zbalansowany między Evo a STO. Idealny kompromis.',
  'car', 'epic', 'Lamborghini', 640, true, false,
  'Lamborghini', 'Huracán Tecnica', 640, 565, 325, 2022,
  '5.2L V10', 10, 3.2, 1379, 'RWD',
  'Tylny napęd i przeprojektowany tył dla lepszej stabilności'
),

-- McLaren GT
(
  'McLaren GT',
  'Grand Tourer od McLarena. Komfortowy, ale wciąż szybki.',
  'car', 'epic', 'McLaren', 620, true, false,
  'McLaren', 'GT', 620, 630, 326, 2019,
  '4.0L V8 Twin Turbo', 8, 3.2, 1530, 'RWD',
  'Bagażnik mieści zestaw kijów golfowych i walizkę'
),

-- Porsche 911 GT2 RS
(
  'Porsche 911 GT2 RS',
  'Najbardziej brutalne 911 w historii. Potwór z tylnym napędem.',
  'car', 'epic', 'Porsche', 700, true, false,
  'Porsche', '911 GT2 RS (991)', 700, 750, 340, 2017,
  '3.8L Boxer 6 Twin Turbo', 6, 2.8, 1470, 'RWD',
  'Pierwsze seryjne 911 pod 7 minut na Nürburgringu'
),

-- ===========================================
-- RARE - Więcej aut sportowych (35 kart)
-- ===========================================

-- BMW M4 Competition
(
  'BMW M4 Competition',
  'Coupe wersja M3. Kontrowersyjny grill, ale świetne osiągi.',
  'car', 'rare', 'BMW', 510, true, false,
  'BMW', 'M4 Competition (G82)', 510, 650, 290, 2021,
  '3.0L I6 Twin Turbo', 6, 3.9, 1725, 'RWD',
  'Duży grill poprawia chłodzenie silnika o 40%'
),

-- Mercedes-AMG E63 S
(
  'Mercedes-AMG E63 S',
  'Najbardziej szalony sedan klasy E. Rodzinny rakietowiec.',
  'car', 'rare', 'Mercedes-AMG', 612, true, false,
  'Mercedes-AMG', 'E63 S', 612, 850, 300, 2021,
  '4.0L V8 Twin Turbo', 8, 3.4, 1995, 'AWD',
  'Tryb Drift wyłącza przedni napęd dla zabawy'
),

-- Audi RS7 Sportback
(
  'Audi RS7 Sportback',
  'Eleganckie RS w nadwoziu fastback. Rakieta w garniturze.',
  'car', 'rare', 'Audi', 600, true, false,
  'Audi', 'RS7 Sportback', 600, 800, 305, 2019,
  '4.0L V8 Twin Turbo Mild Hybrid', 8, 3.6, 2065, 'AWD',
  'Współczynnik oporu 0.28 - jak u sportowego coupe'
),

-- Audi RS Q8
(
  'Audi RS Q8',
  'Najszybsze SUV Audi. Pokonało rekord Nürburgringu wśród SUV-ów.',
  'car', 'rare', 'Audi', 600, true, false,
  'Audi', 'RS Q8', 600, 800, 305, 2020,
  '4.0L V8 Twin Turbo Mild Hybrid', 8, 3.8, 2315, 'AWD',
  'Przejechało Nordschleife w 7:42.253'
),

-- Porsche Cayenne Turbo GT
(
  'Porsche Cayenne Turbo GT',
  'Najbardziej ekstremalne Cayenne. SUV z DNA 911.',
  'car', 'rare', 'Porsche', 640, true, false,
  'Porsche', 'Cayenne Turbo GT', 640, 850, 300, 2021,
  '4.0L V8 Twin Turbo', 8, 3.3, 2245, 'AWD',
  'Najszybszy SUV na Nürburgringu - 7:38.925'
),

-- BMW M2
(
  'BMW M2',
  'Najmniejsze i najczystsze M. Duchowy następca kultowego E30 M3.',
  'car', 'rare', 'BMW', 460, true, false,
  'BMW', 'M2 (G87)', 460, 550, 285, 2023,
  '3.0L I6 Twin Turbo', 6, 4.1, 1700, 'RWD',
  'Używa silnika S58 z M3/M4 - prawdziwe M'
),

-- Mercedes-AMG A45 S
(
  'Mercedes-AMG A45 S',
  'Najpotężniejszy 4-cylindrowy silnik produkcyjny na świecie.',
  'car', 'rare', 'Mercedes-AMG', 421, true, false,
  'Mercedes-AMG', 'A45 S', 421, 500, 270, 2019,
  '2.0L I4 Turbo', 4, 3.9, 1550, 'AWD',
  '211 KM z litra pojemności - rekord produkcyjny'
),

-- Audi RS3 Sportback
(
  'Audi RS3 Sportback',
  'Kompaktowy hot hatch z 5-cylindrowym silnikiem.',
  'car', 'rare', 'Audi', 400, true, false,
  'Audi', 'RS3 Sportback', 400, 500, 290, 2021,
  '2.5L I5 Turbo', 5, 3.8, 1570, 'AWD',
  'Charakterystyczny dźwięk 5-cylindrowego silnika'
),

-- Volkswagen Golf R
(
  'Volkswagen Golf R',
  'Topowa wersja Golfa. AWD i ponad 300 KM.',
  'car', 'rare', 'Volkswagen', 320, true, false,
  'Volkswagen', 'Golf R (Mk8)', 320, 420, 270, 2021,
  '2.0L I4 Turbo', 4, 4.7, 1551, 'AWD',
  'Tryb Drift Mode pozwala na kontrolowane nadsterowność'
),

-- Cupra Leon VZ
(
  'Cupra Leon VZ',
  'Hiszpański hot hatch. Sportowa marka oddzielona od Seata.',
  'car', 'rare', 'Cupra', 300, true, false,
  'Cupra', 'Leon VZ', 300, 400, 250, 2020,
  '2.0L I4 Turbo', 4, 5.7, 1511, 'FWD',
  'VZ = Veloz - szybki po hiszpańsku'
),

-- BMW Z4 M40i
(
  'BMW Z4 M40i',
  'Roadster BMW. Dzieli platformę z Toyota GR Supra.',
  'car', 'rare', 'BMW', 340, true, false,
  'BMW', 'Z4 M40i', 340, 500, 250, 2019,
  '3.0L I6 Turbo', 6, 4.5, 1535, 'RWD',
  'Miękki dach składa się w 10 sekund przy prędkości do 50 km/h'
),

-- Chevrolet Camaro ZL1
(
  'Chevrolet Camaro ZL1',
  'Amerykański muscle car z superchargerem. Konkurent Mustanga.',
  'car', 'rare', 'Chevrolet', 650, true, false,
  'Chevrolet', 'Camaro ZL1', 650, 881, 318, 2017,
  '6.2L V8 Supercharged LT4', 8, 3.5, 1790, 'RWD',
  'Ten sam silnik co w Corvette Z06 poprzedniej generacji'
),

-- Ford Mustang GT
(
  'Ford Mustang GT',
  'Klasyczny amerykański muscle. V8 bez turbodoładowania.',
  'car', 'rare', 'Ford', 450, true, false,
  'Ford', 'Mustang GT (S650)', 450, 515, 250, 2024,
  '5.0L V8 Coyote', 8, 4.3, 1750, 'RWD',
  'Nowa generacja ma elektroniczny e-diff'
),

-- Dodge Charger SRT Hellcat
(
  'Dodge Charger SRT Hellcat',
  'Sedan z mocą supersamochodu. 4 drzwi dla całej rodziny.',
  'car', 'rare', 'Dodge', 717, true, false,
  'Dodge', 'Charger SRT Hellcat', 717, 881, 328, 2015,
  '6.2L V8 Supercharged Hemi', 8, 3.7, 2075, 'RWD',
  'Najszybszy i najpotężniejszy sedan produkcyjny'
),

-- Cadillac CT5-V Blackwing
(
  'Cadillac CT5-V Blackwing',
  'Najpotężniejszy Cadillac w historii. Amerykański super sedan.',
  'car', 'rare', 'Cadillac', 668, true, false,
  'Cadillac', 'CT5-V Blackwing', 668, 893, 322, 2022,
  '6.2L V8 Supercharged', 8, 3.7, 1920, 'RWD',
  'Dostępna z manualną skrzynią 6-biegową!'
),

-- Lexus IS 500
(
  'Lexus IS 500',
  'Jedyny kompaktowy sedan z V8 na rynku. Wolnossący 5.0L.',
  'car', 'rare', 'Lexus', 472, true, false,
  'Lexus', 'IS 500 F Sport', 472, 535, 270, 2022,
  '5.0L V8', 8, 4.5, 1765, 'RWD',
  'Ten sam silnik co w LC 500 i RC F'
),

-- Lexus RC F
(
  'Lexus RC F',
  'Sportowe coupe Lexusa z silnikiem V8.',
  'car', 'rare', 'Lexus', 472, true, false,
  'Lexus', 'RC F', 472, 535, 270, 2019,
  '5.0L V8', 8, 4.5, 1795, 'RWD',
  'Wersja Track Edition zrzuciła 80 kg masy'
),

-- Tesla Model S Plaid
(
  'Tesla Model S Plaid',
  'Najszybszy sedan produkcyjny. Elektryczna rewolucja.',
  'car', 'rare', 'Tesla', 1020, true, false,
  'Tesla', 'Model S Plaid', 1020, 1420, 322, 2021,
  '3x Silnik elektryczny', 0, 2.1, 2162, 'AWD',
  'Przejechało ćwierć mili w 9.23 sekundy - rekord sedanów'
),

-- Porsche Panamera Turbo S
(
  'Porsche Panamera Turbo S',
  'Sportowy sedan z duchem 911. Luksus i osiągi.',
  'car', 'rare', 'Porsche', 630, true, false,
  'Porsche', 'Panamera Turbo S', 630, 820, 315, 2020,
  '4.0L V8 Twin Turbo', 8, 3.1, 2070, 'AWD',
  'Sportowe zawieszenie pneumatyczne z funkcją podnoszenia'
),

-- Genesis G70 3.3T
(
  'Genesis G70',
  'Koreańska odpowiedź na BMW M3. Zaskakująco dobry.',
  'car', 'rare', 'Genesis', 370, true, false,
  'Genesis', 'G70 3.3T', 370, 510, 270, 2019,
  '3.3L V6 Twin Turbo', 6, 4.7, 1755, 'RWD',
  'Projektowany przez byłego szefa designu BMW'
),

-- Infiniti Q60 Red Sport
(
  'Infiniti Q60 Red Sport',
  'Sportowe coupe z podwójnym turbodoładowaniem.',
  'car', 'rare', 'Infiniti', 400, true, false,
  'Infiniti', 'Q60 Red Sport 400', 400, 475, 250, 2017,
  '3.0L V6 Twin Turbo', 6, 4.5, 1810, 'RWD',
  'Silnik VR30DDTT jest również używany w Nissanie Z'
),

-- Porsche Taycan 4S
(
  'Porsche Taycan 4S',
  'Przystępniejsza wersja elektrycznego Porsche.',
  'car', 'rare', 'Porsche', 530, true, false,
  'Porsche', 'Taycan 4S', 530, 640, 250, 2020,
  '2x Silnik elektryczny', 0, 4.0, 2140, 'AWD',
  'Bateria 93.4 kWh zapewnia zasięg ponad 400 km'
),

-- Lotus Exige Sport 410
(
  'Lotus Exige Sport 410',
  'Ekstremalny Lotus dla purystów. Prawie wyścigówka.',
  'car', 'rare', 'Lotus', 416, true, false,
  'Lotus', 'Exige Sport 410', 416, 420, 290, 2018,
  '3.5L V6 Supercharged', 6, 3.4, 1108, 'RWD',
  'Waży mniej niż 1100 kg z płynami!'
),

-- Honda S2000
(
  'Honda S2000',
  'Legendarny roadster z silnikiem VTEC. Klasyk.',
  'car', 'rare', 'Honda', 240, true, false,
  'Honda', 'S2000 AP2', 240, 220, 241, 2004,
  '2.2L I4 VTEC', 4, 5.8, 1260, 'RWD',
  'Silnik F22C kręcił się do 8000 obr/min - rekord dla wolnossących 4-cylindrowych'
),

-- Nissan 370Z
(
  'Nissan 370Z',
  'Japońskie sportowe coupe z tradycją od lat 70.',
  'car', 'rare', 'Nissan', 332, true, false,
  'Nissan', '370Z Nismo', 350, 374, 250, 2013,
  '3.7L V6', 6, 5.2, 1520, 'RWD',
  'Z oznacza Zenith - szczyt możliwości Nissana'
),

-- Nissan Z
(
  'Nissan Z',
  'Nowa generacja kultowej serii Z. Powrót legendy.',
  'car', 'rare', 'Nissan', 400, true, false,
  'Nissan', 'Z Performance', 400, 475, 250, 2023,
  '3.0L V6 Twin Turbo', 6, 4.5, 1580, 'RWD',
  'Design łączy elementy wszystkich poprzednich Z-tek'
),

-- Subaru WRX STI
(
  'Subaru WRX STI',
  'Legenda rajdów. Charakterystyczny dźwięk boxera.',
  'car', 'rare', 'Subaru', 310, true, false,
  'Subaru', 'WRX STI', 310, 400, 255, 2019,
  '2.5L Boxer 4 Turbo', 4, 5.2, 1540, 'AWD',
  'EJ25 to jeden z najdłużej produkowanych silników sportowych'
),

-- Mitsubishi Lancer Evo X
(
  'Mitsubishi Lancer Evo X',
  'Ostatnia ewolucja. Koniec legendarnej serii.',
  'car', 'rare', 'Mitsubishi', 295, true, false,
  'Mitsubishi', 'Lancer Evolution X', 295, 407, 250, 2008,
  '2.0L I4 Turbo MIVEC', 4, 4.5, 1565, 'AWD',
  'System S-AWC to jeden z najlepszych AWD na świecie'
),

-- Porsche Macan GTS
(
  'Porsche Macan GTS',
  'Sportowy SUV dla entuzjastów. Prowadzi się jak Porsche.',
  'car', 'rare', 'Porsche', 440, true, false,
  'Porsche', 'Macan GTS', 440, 550, 272, 2022,
  '2.9L V6 Twin Turbo', 6, 4.3, 1940, 'AWD',
  'Najlepiej sprzedający się model Porsche'
),

-- Range Rover Sport SVR
(
  'Range Rover Sport SVR',
  'Luksusowy SUV z supercharged V8.',
  'car', 'rare', 'Land Rover', 575, true, false,
  'Land Rover', 'Range Rover Sport SVR', 575, 700, 283, 2018,
  '5.0L V8 Supercharged', 8, 4.5, 2330, 'AWD',
  'SVR = Special Vehicle Racing'
),

-- Jeep Grand Cherokee Trackhawk
(
  'Jeep Grand Cherokee Trackhawk',
  'SUV z silnikiem Hellcat. Szaleństwo na czterech kołach.',
  'car', 'rare', 'Jeep', 710, true, false,
  'Jeep', 'Grand Cherokee Trackhawk', 710, 875, 290, 2018,
  '6.2L V8 Supercharged Hemi', 8, 3.5, 2433, 'AWD',
  'Najszybszy SUV w sprincie 0-100 km/h w momencie debiutu'
),

-- ===========================================
-- COMMON - Więcej hot hatchy i aut codziennych (35 kart)
-- ===========================================

-- Toyota GR Yaris
(
  'Toyota GR Yaris',
  'Homologacyjna bestia. Zaprojektowany do WRC.',
  'car', 'common', 'Toyota', 261, true, false,
  'Toyota', 'GR Yaris', 261, 360, 230, 2020,
  '1.6L I3 Turbo', 3, 5.5, 1280, 'AWD',
  '3-cylindrowy silnik to najmocniejszy masowo produkowany silnik tego typu'
),

-- Toyota GR Corolla
(
  'Toyota GR Corolla',
  'Hot hatch z DNA Yarisa GR. Większy i praktyczniejszy.',
  'car', 'common', 'Toyota', 300, true, false,
  'Toyota', 'GR Corolla', 300, 370, 250, 2023,
  '1.6L I3 Turbo', 3, 4.99, 1474, 'AWD',
  'Ten sam silnik G16E-GTS co w GR Yaris, ale mocniejszy'
),

-- Hyundai Elantra N
(
  'Hyundai Elantra N',
  'Sportowy sedan od Hyundai N. Alternatywa dla Golf R.',
  'car', 'common', 'Hyundai', 280, true, false,
  'Hyundai', 'Elantra N', 280, 392, 250, 2022,
  '2.0L I4 Turbo', 4, 5.3, 1485, 'FWD',
  'N = Namyang (centrum R&D Hyundai) i Nürburgring'
),

-- Hyundai Veloster N
(
  'Hyundai Veloster N',
  'Asymetryczny hot hatch. 3 drzwi z jednej strony, 2 z drugiej.',
  'car', 'common', 'Hyundai', 275, true, false,
  'Hyundai', 'Veloster N', 275, 353, 250, 2019,
  '2.0L I4 Turbo', 4, 5.6, 1395, 'FWD',
  'Jedyny samochód z asymetrycznym układem drzwi'
),

-- Kia Stinger GT
(
  'Kia Stinger GT',
  'Sportowe gran turismo od Kii. Projektowane przez byłych z BMW.',
  'car', 'common', 'Kia', 370, true, false,
  'Kia', 'Stinger GT', 370, 510, 270, 2018,
  '3.3L V6 Twin Turbo', 6, 4.9, 1870, 'RWD',
  'Peter Schreyer z Audi zaprojektował to auto'
),

-- Ford Fiesta ST
(
  'Ford Fiesta ST',
  'Mały ale zwinny. Idealny na kręte drogi.',
  'car', 'common', 'Ford', 200, true, false,
  'Ford', 'Fiesta ST', 200, 290, 232, 2018,
  '1.5L I3 Turbo', 3, 6.5, 1187, 'FWD',
  '3-cylindrowy silnik ma cylinder wyłączania dla oszczędności'
),

-- Ford Puma ST
(
  'Ford Puma ST',
  'Sportowy crossover od Forda. Praktyczny hot hatch.',
  'car', 'common', 'Ford', 200, true, false,
  'Ford', 'Puma ST', 200, 320, 220, 2020,
  '1.5L I3 Turbo', 3, 6.7, 1358, 'FWD',
  'Megabox w bagażniku mieści 80 litrów i ma korek spustowy'
),

-- Skoda Octavia RS
(
  'Skoda Octavia RS',
  'Rozsądny hot hatch. Praktyczność i osiągi w jednym.',
  'car', 'common', 'Skoda', 245, true, false,
  'Skoda', 'Octavia RS', 245, 370, 250, 2020,
  '2.0L I4 Turbo', 4, 6.2, 1440, 'FWD',
  'Dostępna jako sedan lub kombi - jedyna taka w segmencie'
),

-- Peugeot 308 GT
(
  'Peugeot 308 GT',
  'Stylowy hot hatch z nowym designem.',
  'car', 'common', 'Peugeot', 225, true, false,
  'Peugeot', '308 GT', 225, 300, 250, 2022,
  '1.6L I4 Turbo Hybrid', 4, 7.5, 1520, 'FWD',
  'Nowy i-Cockpit z mniejszą kierownicą i wyżej umieszczonymi zegarami'
),

-- Volkswagen Polo GTI
(
  'Volkswagen Polo GTI',
  'Młodszy brat Golfa GTI. Kompaktowy ale dynamiczny.',
  'car', 'common', 'Volkswagen', 207, true, false,
  'Volkswagen', 'Polo GTI', 207, 320, 240, 2021,
  '2.0L I4 Turbo', 4, 6.5, 1355, 'FWD',
  'Ma więcej mocy niż Golf GTI Mk4!'
),

-- Opel Corsa OPC
(
  'Opel Corsa OPC',
  'Mały i zwinny hot hatch od Opla.',
  'car', 'common', 'Opel', 207, true, false,
  'Opel', 'Corsa-e OPC', 156, 260, 150, 2023,
  'Silnik elektryczny', 0, 8.1, 1530, 'FWD',
  'Pierwsza elektryczna Corsa OPC w historii'
),

-- Fiat 124 Spider Abarth
(
  'Fiat 124 Spider Abarth',
  'Włoski roadster na bazie Mazdy MX-5.',
  'car', 'common', 'Abarth', 170, true, false,
  'Abarth', '124 Spider', 170, 250, 232, 2016,
  '1.4L I4 MultiAir Turbo', 4, 6.8, 1130, 'RWD',
  'Podwozie MX-5, ale włoski silnik turbo i design'
),

-- Mazda 3 Turbo
(
  'Mazda 3 Turbo',
  'Luksusowy kompakt z turbodoładowaniem.',
  'car', 'common', 'Mazda', 250, true, false,
  'Mazda', '3 Turbo', 250, 434, 250, 2021,
  '2.5L I4 Turbo', 4, 5.8, 1525, 'AWD',
  'Wnętrze zaprojektowane według japońskiej filozofii less is more'
),

-- Honda Accord Type R
(
  'Honda Accord Type R',
  'Japońska legenda. Wolnossący silnik VTEC.',
  'car', 'common', 'Honda', 220, true, false,
  'Honda', 'Accord Type R', 220, 213, 230, 1999,
  '2.2L I4 VTEC', 4, 6.7, 1330, 'FWD',
  'Silnik H22A7 kręcił się do 7200 obr/min'
),

-- Honda Integra Type R
(
  'Honda Integra Type R',
  'Kultowy hot hatch z lat 90. Marzenie każdego fana Hondy.',
  'car', 'common', 'Honda', 220, true, false,
  'Honda', 'Integra Type R (DC2)', 200, 181, 233, 1998,
  '1.8L I4 VTEC', 4, 6.5, 1140, 'FWD',
  'Silnik B18C wciąż jest uważany za jeden z najlepszych wolnossących'
),

-- BMW 128ti
(
  'BMW 128ti',
  'Przednionapędowe BMW dla entuzjastów. Powrót do korzeni.',
  'car', 'common', 'BMW', 265, true, false,
  'BMW', '128ti', 265, 400, 250, 2020,
  '2.0L I4 Turbo', 4, 6.1, 1455, 'FWD',
  'ti = Turismo Internazionale - hołd dla klasycznych BMW'
),

-- SEAT Leon Cupra
(
  'SEAT Leon Cupra',
  'Hiszpański hot hatch przed erą Cupry.',
  'car', 'common', 'SEAT', 290, true, false,
  'SEAT', 'Leon Cupra 290', 290, 380, 250, 2016,
  '2.0L I4 Turbo', 4, 5.7, 1395, 'FWD',
  'Najszybszy przednionapędowy samochód na Nürburgringu w 2014'
),

-- Volkswagen Scirocco R
(
  'Volkswagen Scirocco R',
  'Sportowe coupe bazujące na Golfie. Wycofane z produkcji.',
  'car', 'common', 'Volkswagen', 280, true, false,
  'Volkswagen', 'Scirocco R', 280, 350, 250, 2014,
  '2.0L I4 Turbo', 4, 5.8, 1426, 'FWD',
  'Nazwa pochodzi od gorącego wiatru pustynnego'
),

-- Opel Astra OPC
(
  'Opel Astra OPC',
  'Niemiecki hot hatch z Nürburgringu.',
  'car', 'common', 'Opel', 280, true, false,
  'Opel', 'Astra OPC', 280, 400, 250, 2012,
  '2.0L I4 Turbo', 4, 6.0, 1475, 'FWD',
  'OPC = Opel Performance Center'
),

-- Alfa Romeo Mito QV
(
  'Alfa Romeo Mito QV',
  'Mały włoski hot hatch z charakterem.',
  'car', 'common', 'Alfa Romeo', 170, true, false,
  'Alfa Romeo', 'Mito Quadrifoglio Verde', 170, 250, 220, 2009,
  '1.4L I4 MultiAir Turbo', 4, 7.5, 1195, 'FWD',
  'Quadrifoglio Verde = Zielona Koniczyna - symbol szczęścia Alfy'
),

-- Citroen DS3 Racing
(
  'Citroen DS3 Racing',
  'Francuski hot hatch z charakterem.',
  'car', 'common', 'Citroen', 207, true, false,
  'Citroen', 'DS3 Racing', 207, 275, 235, 2011,
  '1.6L I4 Turbo', 4, 6.5, 1240, 'FWD',
  'Limitowana edycja - tylko 1000 sztuk z tym silnikiem'
),

-- Lancia Delta Integrale
(
  'Lancia Delta Integrale',
  'Legenda rajdów WRC. Królowa lat 80 i 90.',
  'car', 'common', 'Lancia', 215, true, false,
  'Lancia', 'Delta HF Integrale', 215, 300, 220, 1991,
  '2.0L I4 Turbo', 4, 5.7, 1340, 'AWD',
  'Zdobyła 6 tytułów konstruktorów WRC z rzędu'
),

-- Renault Clio RS
(
  'Renault Clio RS',
  'Kompaktowy francuski hot hatch. Zwinny i szybki.',
  'car', 'common', 'Renault', 220, true, false,
  'Renault', 'Clio RS Trophy', 220, 280, 240, 2018,
  '1.6L I4 Turbo', 4, 6.6, 1280, 'FWD',
  'Wersja Trophy ma zawieszenie Öhlins i hamulce Brembo'
),

-- Peugeot 205 GTI
(
  'Peugeot 205 GTI',
  'Klasyk hot hatchy z lat 80. Wciąż pożądany.',
  'car', 'common', 'Peugeot', 130, true, false,
  'Peugeot', '205 GTI 1.9', 130, 167, 210, 1987,
  '1.9L I4', 4, 7.8, 910, 'FWD',
  'Uznawany za jeden z najlepszych hot hatchy w historii'
),

-- Ford Escort RS Cosworth
(
  'Ford Escort RS Cosworth',
  'Legenda grupy A. Charakterystyczne tylne skrzydło.',
  'car', 'common', 'Ford', 227, true, false,
  'Ford', 'Escort RS Cosworth', 227, 304, 230, 1992,
  '2.0L I4 Turbo', 4, 5.7, 1275, 'AWD',
  'Wielkie tylne skrzydło było wymagane przez przepisy homologacyjne'
),

-- Volkswagen Corrado VR6
(
  'Volkswagen Corrado VR6',
  'Sportowe coupe z unikatowym silnikiem VR6.',
  'car', 'common', 'Volkswagen', 190, true, false,
  'Volkswagen', 'Corrado VR6', 190, 245, 235, 1992,
  '2.9L VR6', 6, 6.7, 1330, 'FWD',
  'VR6 to kompaktowy V6 pod kątem 15 stopni'
),

-- Mitsubishi Eclipse GSX
(
  'Mitsubishi Eclipse GSX',
  'Sportowe coupe popularne w filmach Fast & Furious.',
  'car', 'common', 'Mitsubishi', 210, true, false,
  'Mitsubishi', 'Eclipse GSX', 210, 305, 230, 1997,
  '2.0L I4 Turbo', 4, 6.4, 1470, 'AWD',
  'Zielone Eclipse było jednym z głównych aut w pierwszym F&F'
),

-- Nissan Silvia S15
(
  'Nissan Silvia S15',
  'Japońska legenda driftu. Ostatnia generacja Silvii.',
  'car', 'common', 'Nissan', 250, true, false,
  'Nissan', 'Silvia S15 Spec-R', 250, 275, 245, 1999,
  '2.0L I4 Turbo SR20DET', 4, 5.5, 1240, 'RWD',
  'Nigdy oficjalnie nie sprzedawana w Europie'
),

-- Toyota Celica GT-Four
(
  'Toyota Celica GT-Four',
  'Rajdowa legenda z napędem 4x4.',
  'car', 'common', 'Toyota', 245, true, false,
  'Toyota', 'Celica GT-Four ST205', 245, 304, 240, 1994,
  '2.0L I4 Turbo 3S-GTE', 4, 5.9, 1380, 'AWD',
  'Carlos Sainz Sr. wygrał nią rajd Monte Carlo'
),

-- Daihatsu Copen
(
  'Daihatsu Copen',
  'Miniaturowy roadster. Japoński kei car.',
  'car', 'common', 'Daihatsu', 64, true, false,
  'Daihatsu', 'Copen', 64, 110, 150, 2002,
  '0.66L I4 Turbo', 4, 11.0, 830, 'FWD',
  'Metalowy składany dach w aucie o długości 3.4m'
),

-- Smart Brabus
(
  'Smart Brabus',
  'Najmniejszy hot hatch. Tuning od Brabusa.',
  'car', 'common', 'Smart', 109, true, false,
  'Smart', 'Fortwo Brabus', 109, 170, 165, 2017,
  '0.9L I3 Turbo', 3, 9.5, 1000, 'RWD',
  'Tylny napęd w aucie o rozstawie osi 1.87m'
),

-- Fiat Panda 100HP
(
  'Fiat Panda 100HP',
  'Mały włoski pocket rocket.',
  'car', 'common', 'Fiat', 100, true, false,
  'Fiat', 'Panda 100HP', 100, 152, 182, 2006,
  '1.4L I4', 4, 9.5, 975, 'FWD',
  'Idealne 100 KM na tonę masy'
),

-- Renault Twingo RS
(
  'Renault Twingo RS',
  'Mały, szalony hatchback od Renault Sport.',
  'car', 'common', 'Renault', 133, true, false,
  'Renault', 'Twingo RS', 133, 160, 201, 2008,
  '1.6L I4', 4, 8.7, 1090, 'FWD',
  'Cup chassis było tak twarde, że musiało mieć ostrzeżenie'
)
ON CONFLICT (name) DO NOTHING;

-- Podsumowanie dodanych kart
SELECT
  'PACK 2 DODANY!' as status,
  rarity,
  COUNT(*) as ilosc
FROM cards
WHERE card_type = 'car' AND is_hero IS NOT TRUE
GROUP BY rarity
ORDER BY
  CASE rarity
    WHEN 'legendary' THEN 1
    WHEN 'epic' THEN 2
    WHEN 'rare' THEN 3
    WHEN 'common' THEN 4
  END;
