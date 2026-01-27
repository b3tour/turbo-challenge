-- Turbo Challenge - Karty Samochodów
-- Skrypt do dodania ~40 prawdziwych kart samochodów z danymi technicznymi
-- Użycie: Wykonaj w Supabase SQL Editor

-- Najpierw usuń istniejące karty samochodów (opcjonalnie - odkomentuj jeśli potrzeba)
-- DELETE FROM cards WHERE card_type = 'car' AND is_hero = false;

-- ===========================================
-- LEGENDARY - Hypercary (7 kart)
-- ===========================================

INSERT INTO cards (
  name, description, card_type, rarity, category, points, is_active, is_purchasable,
  car_brand, car_model, car_horsepower, car_torque, car_max_speed, car_year,
  car_engine, car_cylinders, car_acceleration, car_weight, car_drivetrain, car_fun_fact
) VALUES

-- 1. Bugatti Chiron
(
  'Bugatti Chiron',
  'Następca legendy Veyron. Chiron to jeden z najszybszych i najdroższych samochodów na świecie.',
  'car', 'legendary', 'Bugatti', 1500, true, false,
  'Bugatti', 'Chiron', 1500, 1600, 420, 2016,
  '8.0L W16 Quad Turbo', 16, 2.4, 1996, 'AWD',
  'Elektroniczny ogranicznik limituje prędkość do 420 km/h, ale wersja Super Sport osiągnęła 490 km/h'
),

-- 2. Koenigsegg Jesko
(
  'Koenigsegg Jesko',
  'Nazwany na cześć ojca założyciela marki. Zaprojektowany do pobicia rekordu prędkości.',
  'car', 'legendary', 'Koenigsegg', 1600, true, false,
  'Koenigsegg', 'Jesko', 1600, 1500, 480, 2019,
  '5.0L V8 Twin Turbo', 8, 2.5, 1420, 'RWD',
  'Teoretyczna prędkość maksymalna wersji Absolut to ponad 530 km/h'
),

-- 3. Ferrari LaFerrari
(
  'Ferrari LaFerrari',
  'Pierwszy hybrydowy supersamochód Ferrari. Część świętej trójcy hipercarów.',
  'car', 'legendary', 'Ferrari', 963, true, false,
  'Ferrari', 'LaFerrari', 963, 900, 350, 2013,
  '6.3L V12 + KERS', 12, 2.4, 1585, 'RWD',
  'Wyprodukowano tylko 499 sztuk coupe i 210 sztuk Aperta (cabrio)'
),

-- 4. McLaren P1
(
  'McLaren P1',
  'Hybrydowy hypercar z technologią prosto z Formuły 1. Członek świętej trójcy.',
  'car', 'legendary', 'McLaren', 916, true, false,
  'McLaren', 'P1', 916, 900, 350, 2013,
  '3.8L V8 Twin Turbo + Silnik elektryczny', 8, 2.8, 1490, 'RWD',
  'Aktywny tylny spojler generuje 600 kg docisku przy 257 km/h'
),

-- 5. Porsche 918 Spyder
(
  'Porsche 918 Spyder',
  'Hybrydowy supersamochód, który ustanowił rekord Nürburgringu. Trzeci z świętej trójcy.',
  'car', 'legendary', 'Porsche', 887, true, false,
  'Porsche', '918 Spyder', 887, 1280, 345, 2013,
  '4.6L V8 + 2x Silnik elektryczny', 8, 2.6, 1674, 'AWD',
  'Może jechać w pełni elektrycznym trybie przez 30 km'
),

-- 6. Lamborghini Aventador SVJ
(
  'Lamborghini Aventador SVJ',
  'Najpotężniejszy Aventador z aktywną aerodynamiką ALA 2.0.',
  'car', 'legendary', 'Lamborghini', 770, true, false,
  'Lamborghini', 'Aventador SVJ', 770, 720, 350, 2018,
  '6.5L V12', 12, 2.8, 1525, 'AWD',
  'Pobił rekord Nürburgringu wśród aut produkcyjnych czasem 6:44.97'
),

-- 7. Pagani Huayra BC
(
  'Pagani Huayra BC',
  'Dzieło sztuki na kołach. BC to inicjały Benny Caiola - przyjaciela Pagani.',
  'car', 'legendary', 'Pagani', 800, true, false,
  'Pagani', 'Huayra BC', 800, 1050, 370, 2016,
  '6.0L V12 Twin Turbo (Mercedes-AMG)', 12, 2.8, 1218, 'RWD',
  'Każdy element nadwozia jest wykonany ręcznie z włókna węglowego'
),

-- ===========================================
-- EPIC - Supersamochody (12 kart)
-- ===========================================

-- 8. Ferrari 488 GTB
(
  'Ferrari 488 GTB',
  'Następca legendarnego 458. Pierwszy turbodoładowany V8 Ferrari od czasów F40.',
  'car', 'epic', 'Ferrari', 670, true, false,
  'Ferrari', '488 GTB', 670, 760, 330, 2015,
  '3.9L V8 Twin Turbo', 8, 3.0, 1475, 'RWD',
  'Silnik zdobył nagrodę International Engine of the Year 2016, 2017 i 2018'
),

-- 9. Lamborghini Huracán EVO
(
  'Lamborghini Huracán EVO',
  'Ewolucja Huracána z lepszą aerodynamiką i zaawansowaną elektroniką.',
  'car', 'epic', 'Lamborghini', 640, true, false,
  'Lamborghini', 'Huracán EVO', 640, 600, 325, 2019,
  '5.2L V10', 10, 2.9, 1422, 'AWD',
  'System LDVI przewiduje zachowanie kierowcy i dostosowuje auto'
),

-- 10. McLaren 720S
(
  'McLaren 720S',
  'Supersamochód nowej generacji z innowacyjnym nadwoziem Monocage II.',
  'car', 'epic', 'McLaren', 720, true, false,
  'McLaren', '720S', 720, 770, 341, 2017,
  '4.0L V8 Twin Turbo', 8, 2.9, 1419, 'RWD',
  'Drzwi dihedral otwierają się pod kątem, aby ułatwić wsiadanie'
),

-- 11. Porsche 911 Turbo S (992)
(
  'Porsche 911 Turbo S',
  'Najnowsza generacja ikony. Niewiarygodna szybkość w codziennym aucie.',
  'car', 'epic', 'Porsche', 650, true, false,
  'Porsche', '911 Turbo S (992)', 650, 800, 330, 2020,
  '3.8L Boxer 6 Twin Turbo', 6, 2.7, 1640, 'AWD',
  'Przyspiesza szybciej niż poprzednia generacja GT2 RS'
),

-- 12. Aston Martin DBS Superleggera
(
  'Aston Martin DBS Superleggera',
  'Flagowy GT Astona z brutalną mocą i eleganckim wyglądem.',
  'car', 'epic', 'Aston Martin', 725, true, false,
  'Aston Martin', 'DBS Superleggera', 725, 900, 340, 2018,
  '5.2L V12 Twin Turbo', 12, 3.4, 1693, 'RWD',
  'Nazwa Superleggera nawiązuje do historycznej włoskiej techniki budowy karoserii'
),

-- 13. Mercedes-AMG GT R
(
  'Mercedes-AMG GT R',
  'Bestia z Zielonego Piekła. Stworzony na torze Nürburgring.',
  'car', 'epic', 'Mercedes-AMG', 585, true, false,
  'Mercedes-AMG', 'GT R', 585, 700, 318, 2016,
  '4.0L V8 Twin Turbo', 8, 3.6, 1630, 'RWD',
  'Tylna oś skrętna pozwala na lepszą zwrotność na torze'
),

-- 14. Audi R8 V10 Performance
(
  'Audi R8 V10 Performance',
  'Codzienne superauto z silnikiem z Lamborghini. Quattro daje pewność prowadzenia.',
  'car', 'epic', 'Audi', 620, true, false,
  'Audi', 'R8 V10 Performance', 620, 580, 331, 2019,
  '5.2L V10', 10, 3.1, 1670, 'AWD',
  'Silnik V10 dzieli z Lamborghini Huracán'
),

-- 15. Nissan GT-R Nismo
(
  'Nissan GT-R Nismo',
  'Godzilla w najostrzejszej wersji. Legenda z Need for Speed i Fast & Furious.',
  'car', 'epic', 'Nissan', 600, true, false,
  'Nissan', 'GT-R Nismo', 600, 652, 315, 2020,
  '3.8L V6 Twin Turbo', 6, 2.5, 1725, 'AWD',
  'Ręcznie składany silnik - każdy ma podpis swojego montażysty'
),

-- 16. Chevrolet Corvette C8 Z06
(
  'Chevrolet Corvette Z06',
  'Pierwsza Corvette z centralnym silnikiem w wersji Z06. Amerykański supercar.',
  'car', 'epic', 'Chevrolet', 670, true, false,
  'Chevrolet', 'Corvette C8 Z06', 670, 623, 315, 2022,
  '5.5L V8 DOHC Flat-Plane', 8, 2.6, 1561, 'RWD',
  'Silnik LT6 kręci się do 8600 obr/min - najwyżej w historii Corvette'
),

-- 17. Ferrari Roma
(
  'Ferrari Roma',
  'Eleganckie GT w stylu lat 60. Nowa ikona włoskiego designu.',
  'car', 'epic', 'Ferrari', 620, true, false,
  'Ferrari', 'Roma', 620, 760, 320, 2019,
  '3.9L V8 Twin Turbo', 8, 3.4, 1570, 'RWD',
  'Design inspirowany słynnym filmem La Dolce Vita'
),

-- 18. BMW M8 Competition
(
  'BMW M8 Competition',
  'Najbardziej luksusowe M w ofercie. Gran Turismo z mocą supersamochodu.',
  'car', 'epic', 'BMW', 625, true, false,
  'BMW', 'M8 Competition', 625, 750, 305, 2019,
  '4.4L V8 Twin Turbo', 8, 3.2, 1885, 'AWD',
  'Dostępne w wersji coupe, cabrio i Gran Coupe'
),

-- 19. Lexus LFA
(
  'Lexus LFA',
  'Japońska perfekcja. Silnik V10 opracowany z Yamahamą brzmi jak F1.',
  'car', 'epic', 'Lexus', 560, true, false,
  'Lexus', 'LFA', 560, 480, 325, 2010,
  '4.8L V10', 10, 3.7, 1480, 'RWD',
  'Silnik kręci się tak szybko, że musieli użyć cyfrowego obrotomierza'
),

-- ===========================================
-- RARE - Samochody sportowe (12 kart)
-- ===========================================

-- 20. Porsche 911 Carrera S
(
  'Porsche 911 Carrera S',
  'Ikona sportowych samochodów. Ponadczasowy design i świetne prowadzenie.',
  'car', 'rare', 'Porsche', 450, true, false,
  'Porsche', '911 Carrera S (992)', 450, 530, 308, 2019,
  '3.0L Boxer 6 Twin Turbo', 6, 3.5, 1515, 'RWD',
  'Od 1964 roku sprzedano ponad milion egzemplarzy 911'
),

-- 21. BMW M3 Competition
(
  'BMW M3 Competition',
  'Legenda segmentu sport sedan. Nowa generacja z kontrowersyjnym grillem.',
  'car', 'rare', 'BMW', 510, true, false,
  'BMW', 'M3 Competition (G80)', 510, 650, 290, 2021,
  '3.0L I6 Twin Turbo', 6, 3.9, 1730, 'RWD',
  'Dostępna także z napędem xDrive po raz pierwszy w historii M3'
),

-- 22. Mercedes-AMG C63 S
(
  'Mercedes-AMG C63 S',
  'Biturbo V8 w kompaktowym sedanie. Brutalna moc w eleganckim opakowaniu.',
  'car', 'rare', 'Mercedes-AMG', 510, true, false,
  'Mercedes-AMG', 'C63 S', 510, 700, 290, 2019,
  '4.0L V8 Twin Turbo', 8, 3.9, 1770, 'RWD',
  'Nowa generacja ma 4-cylindrowy silnik z hybrydem - ta jest ostatnią z V8'
),

-- 23. Audi RS6 Avant
(
  'Audi RS6 Avant',
  'Supersamochód dla rodziny. Kombi które pokonuje większość sportowych aut.',
  'car', 'rare', 'Audi', 600, true, false,
  'Audi', 'RS6 Avant', 600, 800, 305, 2019,
  '4.0L V8 Twin Turbo Mild Hybrid', 8, 3.6, 2075, 'AWD',
  'Bagażnik mieści 565 litrów - można zabrać rodzinę I ich bagaże na tor'
),

-- 24. Ford Mustang Shelby GT500
(
  'Ford Mustang Shelby GT500',
  'Najpotężniejszy Mustang w historii. Supercharged V8 z ponad 760 KM.',
  'car', 'rare', 'Ford', 760, true, false,
  'Ford', 'Mustang Shelby GT500', 760, 847, 290, 2020,
  '5.2L V8 Supercharged', 8, 3.3, 1916, 'RWD',
  'Najszybszy Mustang na torze w historii'
),

-- 25. BMW M5 Competition
(
  'BMW M5 Competition',
  'Sportowy sedan z mocą supersamochodu. Może być codziennym autem.',
  'car', 'rare', 'BMW', 625, true, false,
  'BMW', 'M5 Competition (F90)', 625, 750, 305, 2018,
  '4.4L V8 Twin Turbo', 8, 3.3, 1930, 'AWD',
  'W trybie 2WD cały moment trafia na tylną oś - drift mode'
),

-- 26. Alfa Romeo Giulia Quadrifoglio
(
  'Alfa Romeo Giulia Quadrifoglio',
  'Włoska namiętność w formie sedana. Silnik z Ferrari w Alfie.',
  'car', 'rare', 'Alfa Romeo', 510, true, false,
  'Alfa Romeo', 'Giulia Quadrifoglio', 510, 600, 307, 2016,
  '2.9L V6 Twin Turbo', 6, 3.9, 1580, 'RWD',
  'Silnik bazuje na technologii Ferrari i jest produkowany w tej samej fabryce'
),

-- 27. Porsche 718 Cayman GT4
(
  'Porsche 718 Cayman GT4',
  'Środkowy silnik z 911 GT3. Dla purystów, którzy cenią prowadzenie.',
  'car', 'rare', 'Porsche', 420, true, false,
  'Porsche', '718 Cayman GT4', 420, 420, 304, 2019,
  '4.0L Boxer 6', 6, 4.4, 1420, 'RWD',
  'Wolnossący 4.0L boxer pochodzący z 911 GT3'
),

-- 28. Toyota GR Supra
(
  'Toyota GR Supra',
  'Powrót legendy po 17 latach. Opracowana wspólnie z BMW.',
  'car', 'rare', 'Toyota', 340, true, false,
  'Toyota', 'GR Supra', 340, 500, 250, 2019,
  '3.0L I6 Turbo (BMW B58)', 6, 4.1, 1495, 'RWD',
  'Silnik BMW B58, ale strojony przez Toyota Gazoo Racing'
),

-- 29. Jaguar F-Type R
(
  'Jaguar F-Type R',
  'Brytyjski drapieżnik z jednym z najlepszych brzmień V8.',
  'car', 'rare', 'Jaguar', 575, true, false,
  'Jaguar', 'F-Type R', 575, 700, 300, 2020,
  '5.0L V8 Supercharged', 8, 3.7, 1743, 'AWD',
  'Aktywny wydech sprawia, że to jeden z najlepiej brzmiących samochodów'
),

-- 30. Dodge Challenger SRT Hellcat
(
  'Dodge Challenger SRT Hellcat',
  'Amerykański muscle car z piekła rodem. Supercharged 6.2L Hemi.',
  'car', 'rare', 'Dodge', 717, true, false,
  'Dodge', 'Challenger SRT Hellcat', 717, 881, 320, 2015,
  '6.2L V8 Supercharged Hemi', 8, 3.6, 2018, 'RWD',
  'Przy pełnym gazie zużywa 4.2 litra paliwa na minutę'
),

-- 31. Alpine A110 S
(
  'Alpine A110 S',
  'Francuska lekkość i precyzja. Nowoczesna interpretacja klasyka.',
  'car', 'rare', 'Alpine', 292, true, false,
  'Alpine', 'A110 S', 292, 320, 260, 2019,
  '1.8L I4 Turbo', 4, 4.4, 1114, 'RWD',
  'Waży mniej niż Mazda MX-5, ale ma prawie 2x więcej mocy'
),

-- ===========================================
-- COMMON - Hot hatche i entry-level (12 kart)
-- ===========================================

-- 32. Volkswagen Golf GTI
(
  'Volkswagen Golf GTI',
  'Protoplasta hot hatchy. Od 1976 roku definicja szybkiego kompaktu.',
  'car', 'common', 'Volkswagen', 245, true, false,
  'Volkswagen', 'Golf GTI (Mk8)', 245, 370, 250, 2020,
  '2.0L I4 Turbo', 4, 6.3, 1430, 'FWD',
  'Sprzedano ponad 2 miliony GTI od 1976 roku'
),

-- 33. Honda Civic Type R
(
  'Honda Civic Type R',
  'Najbardziej ekstremalny hot hatch. Rekord Nürburgringu wśród FWD.',
  'car', 'common', 'Honda', 320, true, false,
  'Honda', 'Civic Type R (FL5)', 320, 420, 275, 2023,
  '2.0L I4 VTEC Turbo', 4, 5.4, 1430, 'FWD',
  'Posiada rekord toru Nürburgring wśród aut przednionapędowych'
),

-- 34. Ford Focus RS
(
  'Ford Focus RS',
  'Hot hatch z napędem AWD i drift mode. Ulubieniec entuzjastów.',
  'car', 'common', 'Ford', 350, true, false,
  'Ford', 'Focus RS (Mk3)', 350, 470, 266, 2016,
  '2.3L I4 EcoBoost', 4, 4.7, 1569, 'AWD',
  'Drift Mode przesyła 70% momentu na tylną oś'
),

-- 35. Mazda MX-5
(
  'Mazda MX-5',
  'Najlepiej sprzedający się roadster świata. Czysta radość z jazdy.',
  'car', 'common', 'Mazda', 184, true, false,
  'Mazda', 'MX-5 (ND)', 184, 205, 219, 2015,
  '2.0L I4 Skyactiv-G', 4, 6.5, 1060, 'RWD',
  'Ponad milion sprzedanych egzemplarzy - Guinness World Record'
),

-- 36. Toyota GR86
(
  'Toyota GR86',
  'Lekki, tylnonapędowy coupe dla purystów. Idealny do nauki driftu.',
  'car', 'common', 'Toyota', 234, true, false,
  'Toyota', 'GR86', 234, 250, 226, 2021,
  '2.4L Boxer 4', 4, 6.3, 1270, 'RWD',
  'Niska i centralna pozycja silnika daje niemal idealny rozkład masy 53:47'
),

-- 37. Subaru BRZ
(
  'Subaru BRZ',
  'Bliźniak GR86 z charakterem Subaru. Boxer w tylnonapędowym aucie.',
  'car', 'common', 'Subaru', 234, true, false,
  'Subaru', 'BRZ', 234, 250, 226, 2021,
  '2.4L Boxer 4', 4, 6.3, 1270, 'RWD',
  'Jedyne tylnonapędowe Subaru w ofercie - wszystkie inne mają AWD'
),

-- 38. Hyundai i30 N
(
  'Hyundai i30 N',
  'Koreański hot hatch, który zaskoczył świat. Strojony na Nürburgringu.',
  'car', 'common', 'Hyundai', 280, true, false,
  'Hyundai', 'i30 N', 280, 392, 250, 2017,
  '2.0L I4 Turbo', 4, 5.9, 1429, 'FWD',
  'Szef projektu - Albert Biermann - wcześniej pracował w BMW M Division'
),

-- 39. Mini John Cooper Works
(
  'Mini John Cooper Works',
  'Małe, ale wściekłe. Dziedzictwo rajdowych sukcesów.',
  'car', 'common', 'Mini', 231, true, false,
  'Mini', 'John Cooper Works', 231, 320, 246, 2019,
  '2.0L I4 Turbo', 4, 6.1, 1280, 'FWD',
  'Nazwa pochodzi od legendarnego konstruktora silników wyścigowych'
),

-- 40. Renault Megane RS Trophy
(
  'Renault Megane RS Trophy',
  'Francuski hot hatch z tylnymi kołami skrętnymi. Zabawka dla kierowcy.',
  'car', 'common', 'Renault', 300, true, false,
  'Renault', 'Megane RS Trophy', 300, 420, 260, 2018,
  '1.8L I4 Turbo', 4, 5.7, 1450, 'FWD',
  'System 4-Control skręca tylne koła - w przeciwnym kierunku przy małych prędkościach'
),

-- 41. Abarth 595 Competizione
(
  'Abarth 595 Competizione',
  'Mały skorpion z wielkim charakterem. Włoski temperament w pigułce.',
  'car', 'common', 'Abarth', 180, true, false,
  'Abarth', '595 Competizione', 180, 250, 225, 2019,
  '1.4L I4 Turbo', 4, 6.7, 1110, 'FWD',
  'Nazwa Abarth pochodzi od założyciela Carlo Abartha - znaku skorpiona'
),

-- 42. Suzuki Swift Sport
(
  'Suzuki Swift Sport',
  'Lekki jak piórko. Udowadnia, że radość z jazdy nie wymaga dużej mocy.',
  'car', 'common', 'Suzuki', 140, true, false,
  'Suzuki', 'Swift Sport', 140, 230, 210, 2018,
  '1.4L I4 Turbo BoosterJet', 4, 8.1, 970, 'FWD',
  'Waży mniej niż tona - stosunek mocy do masy lepszy niż u wielu hot hatchy'
),

-- 43. Peugeot 308 GTi
(
  'Peugeot 308 GTi',
  'Francuski hot hatch z lwim pazurem. Świetny na krętych drogach.',
  'car', 'common', 'Peugeot', 270, true, false,
  'Peugeot', '308 GTi', 270, 330, 250, 2015,
  '1.6L I4 Turbo', 4, 6.0, 1280, 'FWD',
  'Opracowany przez Peugeot Sport - dział odpowiedzialny za WRC'
)
ON CONFLICT (name) DO NOTHING;

-- Wyświetl podsumowanie dodanych kart
SELECT
  rarity,
  COUNT(*) as count,
  ROUND(AVG(car_horsepower)) as avg_hp,
  ROUND(AVG(car_torque)) as avg_torque,
  ROUND(AVG(car_max_speed)) as avg_speed
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
