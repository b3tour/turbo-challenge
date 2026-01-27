-- Turbo Challenge - Karty Samochodów PACK 3
-- Klasyki, JDM, Muscle Cars i unikaty
-- Użycie: Wykonaj w Supabase SQL Editor

INSERT INTO cards (
  name, description, card_type, rarity, category, points, is_active, is_purchasable,
  car_brand, car_model, car_horsepower, car_torque, car_max_speed, car_year,
  car_engine, car_cylinders, car_acceleration, car_weight, car_drivetrain, car_fun_fact
) VALUES

-- ===========================================
-- LEGENDARY - Klasyki i unikaty (8 kart)
-- ===========================================

-- Ferrari F40
(
  'Ferrari F40',
  'Ostatnie Ferrari zatwierdzone przez Enzo. Ikona lat 80.',
  'car', 'legendary', 'Ferrari', 478, true, false,
  'Ferrari', 'F40', 478, 577, 324, 1987,
  '2.9L V8 Twin Turbo', 8, 4.1, 1254, 'RWD',
  'Enzo Ferrari powiedział że to najlepsze Ferrari jakie kiedykolwiek zbudowali'
),

-- Ferrari F50
(
  'Ferrari F50',
  'Silnik F1 w samochodzie drogowym. Następca F40.',
  'car', 'legendary', 'Ferrari', 520, true, false,
  'Ferrari', 'F50', 520, 471, 325, 1995,
  '4.7L V12 (F1 derivato)', 12, 3.7, 1350, 'RWD',
  'Silnik pochodzi bezpośrednio z bolidu F1 z 1990 roku'
),

-- Ferrari Enzo
(
  'Ferrari Enzo',
  'Nazwany na cześć założyciela. Technologia F1 na drodze.',
  'car', 'legendary', 'Ferrari', 660, true, false,
  'Ferrari', 'Enzo', 660, 657, 350, 2002,
  '6.0L V12', 12, 3.4, 1365, 'RWD',
  'Wyprodukowano tylko 400 sztuk plus jedna dla Papieża Jana Pawła II'
),

-- McLaren F1
(
  'McLaren F1',
  'Najszybszy wolnossący samochód w historii. Legenda lat 90.',
  'car', 'legendary', 'McLaren', 627, true, false,
  'McLaren', 'F1', 627, 650, 386, 1992,
  '6.1L V12 BMW S70/2', 12, 3.2, 1138, 'RWD',
  'Centralnie umieszczone siedzenie kierowcy jak w bolidzie F1'
),

-- Jaguar XJ220
(
  'Jaguar XJ220',
  'Najszybszy samochód produkcyjny początku lat 90.',
  'car', 'legendary', 'Jaguar', 542, true, false,
  'Jaguar', 'XJ220', 542, 644, 343, 1992,
  '3.5L V6 Twin Turbo', 6, 3.6, 1470, 'RWD',
  'Początkowo planowano V12 i AWD, ale zmieniono na V6 z turbo'
),

-- Mercedes-Benz CLK GTR
(
  'Mercedes-Benz CLK GTR',
  'Homologacyjny supercar z serii GT. Niezwykle rzadki.',
  'car', 'legendary', 'Mercedes-Benz', 612, true, false,
  'Mercedes-Benz', 'CLK GTR', 612, 765, 320, 1998,
  '6.9L V12', 12, 3.8, 1440, 'RWD',
  'Tylko 25 egzemplarzy coupe i 6 roadsterów'
),

-- Porsche 959
(
  'Porsche 959',
  'Najbardziej zaawansowany technologicznie samochód lat 80.',
  'car', 'legendary', 'Porsche', 450, true, false,
  'Porsche', '959', 450, 500, 317, 1986,
  '2.8L Boxer 6 Twin Turbo', 6, 3.7, 1450, 'AWD',
  'Bill Gates musiał czekać 13 lat żeby legalnie jeździć nim w USA'
),

-- Lamborghini Countach
(
  'Lamborghini Countach',
  'Definiujący supercar. Ikona plakatów lat 80.',
  'car', 'legendary', 'Lamborghini', 455, true, false,
  'Lamborghini', 'Countach 25th Anniversary', 455, 500, 295, 1988,
  '5.2L V12', 12, 4.7, 1680, 'RWD',
  'Countach to wykrzyknienie zdziwienia w dialekcie piemonckim'
),

-- ===========================================
-- EPIC - JDM Legends i klasyczne sportowe (20 kart)
-- ===========================================

-- Toyota Supra MK4
(
  'Toyota Supra MK4',
  'Legenda tunerów. Silnik 2JZ wytrzymuje ponad 1000 KM.',
  'car', 'epic', 'Toyota', 330, true, false,
  'Toyota', 'Supra RZ (A80)', 330, 451, 250, 1993,
  '3.0L I6 Twin Turbo 2JZ-GTE', 6, 4.6, 1570, 'RWD',
  '2JZ-GTE to jeden z najtrwalszych silników do tuningu'
),

-- Nissan Skyline GT-R R34
(
  'Nissan Skyline GT-R R34',
  'Godzilla. Kultowy JDM dzięki Fast & Furious.',
  'car', 'epic', 'Nissan', 280, true, false,
  'Nissan', 'Skyline GT-R V-Spec II (R34)', 280, 392, 250, 1999,
  '2.6L I6 Twin Turbo RB26DETT', 6, 4.8, 1560, 'AWD',
  'Fabrycznie podawane 280 KM to gentlemen agreement - realnie ~320 KM'
),

-- Nissan Skyline GT-R R33
(
  'Nissan Skyline GT-R R33',
  'Środkowa generacja GT-R. Niedoceniana perła.',
  'car', 'epic', 'Nissan', 280, true, false,
  'Nissan', 'Skyline GT-R V-Spec (R33)', 280, 368, 250, 1995,
  '2.6L I6 Twin Turbo RB26DETT', 6, 5.0, 1540, 'AWD',
  'Pierwsze japońskie auto które pokonało Nordschleife poniżej 8 minut'
),

-- Nissan Skyline GT-R R32
(
  'Nissan Skyline GT-R R32',
  'Oryginalna Godzilla. Przywróciła legendę GT-R.',
  'car', 'epic', 'Nissan', 280, true, false,
  'Nissan', 'Skyline GT-R (R32)', 280, 361, 250, 1989,
  '2.6L I6 Twin Turbo RB26DETT', 6, 5.1, 1430, 'AWD',
  'Wygrała wszystkie 29 wyścigów w których startowała w JTCC'
),

-- Mazda RX-7 FD
(
  'Mazda RX-7 FD',
  'Ostatnia generacja RX-7. Silnik Wankla twin turbo.',
  'car', 'epic', 'Mazda', 280, true, false,
  'Mazda', 'RX-7 Spirit R (FD3S)', 280, 314, 250, 2002,
  '1.3L Twin Rotor Twin Turbo 13B-REW', 2, 5.1, 1280, 'RWD',
  'Spirit R to najrzadsza i najbardziej pożądana wersja FD'
),

-- Honda NSX NA1
(
  'Honda NSX',
  'Codzienne superauto. Zaprojektowane z pomocą Ayrtona Senny.',
  'car', 'epic', 'Honda', 290, true, false,
  'Honda', 'NSX Type R (NA1)', 290, 304, 270, 1992,
  '3.0L V6 VTEC C30A', 6, 5.0, 1230, 'RWD',
  'Ayrton Senna testował prototypy i sugerował poprawki'
),

-- Mitsubishi 3000GT VR-4
(
  'Mitsubishi 3000GT VR-4',
  'Technologiczny cud lat 90. AWD, AWS, aktywna aerodynamika.',
  'car', 'epic', 'Mitsubishi', 320, true, false,
  'Mitsubishi', '3000GT VR-4', 320, 427, 250, 1991,
  '3.0L V6 Twin Turbo', 6, 4.8, 1740, 'AWD',
  'Miała aktywną aerodynamikę i tylne koła skrętne z fabryki'
),

-- Subaru Impreza 22B STI
(
  'Subaru Impreza 22B STI',
  'Najlegendarniejsze Subaru. Świętowanie sukcesu WRC.',
  'car', 'epic', 'Subaru', 280, true, false,
  'Subaru', 'Impreza 22B STI', 280, 363, 250, 1998,
  '2.2L Boxer 4 Turbo EJ22', 4, 5.0, 1270, 'AWD',
  'Tylko 400 sztuk dla Japonii plus 24 na eksport'
),

-- BMW E30 M3
(
  'BMW E30 M3',
  'Ikona DTM i rajdów. Najbardziej zwycięski samochód wyścigowy lat 80.',
  'car', 'epic', 'BMW', 238, true, false,
  'BMW', 'M3 Sport Evolution (E30)', 238, 240, 248, 1990,
  '2.5L I4 S14', 4, 6.5, 1200, 'RWD',
  'Zdobyła ponad 1500 zwycięstw w motorsporcie'
),

-- BMW M1
(
  'BMW M1',
  'Jedyny prawdziwy supercar BMW. Legenda z lat 70.',
  'car', 'epic', 'BMW', 277, true, false,
  'BMW', 'M1', 277, 330, 262, 1978,
  '3.5L I6 M88', 6, 5.6, 1300, 'RWD',
  'Projektowany jako auto wyścigowe, ale homologowany jako drogowe'
),

-- Audi Sport Quattro
(
  'Audi Sport Quattro',
  'Legenda Grupy B. Rozpoczęła erę napędu 4x4 w rajdach.',
  'car', 'epic', 'Audi', 306, true, false,
  'Audi', 'Sport Quattro S1', 306, 350, 248, 1985,
  '2.1L I5 Turbo', 5, 4.8, 1090, 'AWD',
  'Wersja wyścigowa E2 miała ponad 500 KM'
),

-- Ford RS200
(
  'Ford RS200',
  'Homologacyjna rakieta z Grupy B. Środkowy silnik i AWD.',
  'car', 'epic', 'Ford', 250, true, false,
  'Ford', 'RS200', 250, 290, 225, 1984,
  '1.8L I4 Turbo Cosworth BDT', 4, 6.1, 1180, 'AWD',
  'Zaprojektowane wyłącznie do rajdów - trudne w codziennym użytkowaniu'
),

-- Lancia Stratos
(
  'Lancia Stratos',
  'Pierwszy samochód zaprojektowany specjalnie do rajdów.',
  'car', 'epic', 'Lancia', 190, true, false,
  'Lancia', 'Stratos HF', 190, 226, 230, 1973,
  '2.4L V6 Ferrari Dino', 6, 6.8, 980, 'RWD',
  'Wygrała 3 rajdowe mistrzostwa świata z rzędu'
),

-- Peugeot 205 T16
(
  'Peugeot 205 T16',
  'Potwór Grupy B. Dominował w rajdach 1985-1986.',
  'car', 'epic', 'Peugeot', 200, true, false,
  'Peugeot', '205 T16', 200, 280, 210, 1984,
  '1.8L I4 Turbo', 4, 6.2, 940, 'AWD',
  'Ari Vatanen nazywał wersję evo Tyrannosaurusem'
),

-- Renault 5 Turbo
(
  'Renault 5 Turbo',
  'Szalony pomysł - centralny silnik w małym hatchbacku.',
  'car', 'epic', 'Renault', 160, true, false,
  'Renault', '5 Turbo 2', 160, 210, 206, 1983,
  '1.4L I4 Turbo', 4, 6.6, 970, 'RWD',
  'Silnik przeniesiony z przodu na tył - za siedzeniami'
),

-- De Tomaso Pantera
(
  'De Tomaso Pantera',
  'Włoskie nadwozie, amerykański silnik. Najdłużej produkowany.',
  'car', 'epic', 'De Tomaso', 350, true, false,
  'De Tomaso', 'Pantera GT5-S', 350, 451, 266, 1985,
  '5.8L V8 Ford Cleveland', 8, 5.5, 1418, 'RWD',
  'Elvis Presley strzelił do swojej Pantery, gdy nie chciała odpalić'
),

-- Lotus Esprit V8
(
  'Lotus Esprit V8',
  'Brytyjski supercar z lat 90. Klin na drodze.',
  'car', 'epic', 'Lotus', 350, true, false,
  'Lotus', 'Esprit V8 Twin Turbo', 350, 400, 282, 1996,
  '3.5L V8 Twin Turbo', 8, 4.5, 1380, 'RWD',
  'Pierwszy V8 zaprojektowany przez Lotusa od podstaw'
),

-- TVR Cerbera Speed 12
(
  'TVR Cerbera Speed 12',
  'Najbardziej szalony TVR. 1000+ KM bez elektroniki.',
  'car', 'epic', 'TVR', 1012, true, false,
  'TVR', 'Cerbera Speed 12', 1012, 1100, 386, 1997,
  '7.7L V12 (2x I6)', 12, 3.5, 1100, 'RWD',
  'Tak szalony że TVR odmówiło sprzedaży - zbyt niebezpieczny'
),

-- Noble M600
(
  'Noble M600',
  'Brytyjski supercar bez kompromisów. Czysta mechanika.',
  'car', 'epic', 'Noble', 650, true, false,
  'Noble', 'M600', 650, 819, 362, 2010,
  '4.4L V8 Twin Turbo Yamaha', 8, 3.0, 1198, 'RWD',
  'Brak ABS, brak TC, brak wspomagania - czysta jazda'
),

-- Wiesmann MF5
(
  'Wiesmann MF5',
  'Niemiecki grand tourer z silnikiem BMW V10.',
  'car', 'epic', 'Wiesmann', 555, true, false,
  'Wiesmann', 'MF5', 555, 501, 311, 2009,
  '5.0L V10 BMW S85', 10, 3.9, 1370, 'RWD',
  'Każdy egzemplarz był ręcznie budowany w małej fabryce'
),

-- ===========================================
-- RARE - Muscle cars i klasyczne sportowe (25 kart)
-- ===========================================

-- Ford Mustang Boss 429
(
  'Ford Mustang Boss 429',
  'Legendarna 429 z NASCAR. Najrzadszy Mustang.',
  'car', 'rare', 'Ford', 375, true, false,
  'Ford', 'Mustang Boss 429', 375, 480, 210, 1969,
  '7.0L V8 NASCAR', 8, 6.3, 1565, 'RWD',
  'Tylko 1359 sztuk wyprodukowanych dla homologacji NASCAR'
),

-- Chevrolet Chevelle SS 454
(
  'Chevrolet Chevelle SS 454',
  'Klasyczny muscle car z silnikiem big block.',
  'car', 'rare', 'Chevrolet', 450, true, false,
  'Chevrolet', 'Chevelle SS 454 LS6', 450, 678, 200, 1970,
  '7.4L V8 LS6', 8, 5.4, 1680, 'RWD',
  'LS6 to jedna z najpotężniejszych wersji fabrycznie'
),

-- Plymouth Hemi Cuda
(
  'Plymouth Hemi Cuda',
  'Kultowy muscle car z legendarnym silnikiem Hemi.',
  'car', 'rare', 'Plymouth', 425, true, false,
  'Plymouth', 'Barracuda Hemi', 425, 664, 210, 1970,
  '7.0L V8 Hemi 426', 8, 5.6, 1650, 'RWD',
  'Cabrio z Hemi jest jednym z najdroższych muscle carów'
),

-- Dodge Charger R/T
(
  'Dodge Charger R/T',
  'Ikona z Fast & Furious. Kultowy design lat 60.',
  'car', 'rare', 'Dodge', 375, true, false,
  'Dodge', 'Charger R/T 440', 375, 610, 200, 1968,
  '7.2L V8 Magnum 440', 8, 6.0, 1680, 'RWD',
  'Dom Toretto jeździ tym modelem w filmach'
),

-- Pontiac GTO
(
  'Pontiac GTO',
  'Pierwszy prawdziwy muscle car. Ojciec gatunku.',
  'car', 'rare', 'Pontiac', 360, true, false,
  'Pontiac', 'GTO Judge', 360, 583, 195, 1969,
  '6.5L V8 Ram Air III', 8, 6.2, 1590, 'RWD',
  'GTO = Gran Turismo Omologato - nawiązanie do Ferrari'
),

-- Buick Grand National
(
  'Buick Grand National',
  'Turbo V6 który bił V8. Ciemna strona mocy.',
  'car', 'rare', 'Buick', 276, true, false,
  'Buick', 'Grand National GNX', 276, 500, 200, 1987,
  '3.8L V6 Turbo', 6, 4.7, 1565, 'RWD',
  'GNX pokonywało Ferrari i Porsche w testach magazynowych'
),

-- Oldsmobile 442
(
  'Oldsmobile 442',
  'Legenda muscle carów. Nazwa od konfiguracji.',
  'car', 'rare', 'Oldsmobile', 370, true, false,
  'Oldsmobile', '442 W-30', 370, 500, 195, 1970,
  '7.5L V8 W-30', 8, 6.0, 1650, 'RWD',
  '442 = 4-biegowa skrzynia, 4-gaźnikowa, 2 wydechy'
),

-- AMC Javelin AMX
(
  'AMC Javelin AMX',
  'Niedoceniony muscle car. Konkurent Mustanga.',
  'car', 'rare', 'AMC', 340, true, false,
  'AMC', 'Javelin AMX', 340, 528, 190, 1971,
  '6.4L V8 390', 8, 6.5, 1500, 'RWD',
  'Mark Donohue wygrał Trans-Am Championship Javelinem'
),

-- Shelby Cobra 427
(
  'Shelby Cobra 427',
  'Legendarny amerykańsko-brytyjski roadster.',
  'car', 'rare', 'Shelby', 425, true, false,
  'Shelby', 'Cobra 427', 425, 651, 265, 1965,
  '7.0L V8 Ford FE', 8, 4.3, 1148, 'RWD',
  'Oryginalny CSX3000 jest wart miliony dolarów'
),

-- Ferrari 288 GTO
(
  'Ferrari 288 GTO',
  'Poprzednik F40. Pierwszy współczesny supercar Ferrari.',
  'car', 'rare', 'Ferrari', 400, true, false,
  'Ferrari', '288 GTO', 400, 496, 304, 1984,
  '2.8L V8 Twin Turbo', 8, 4.8, 1160, 'RWD',
  'GTO = Gran Turismo Omologato - stworzony do Grupy B'
),

-- Porsche 911 Carrera RS 2.7
(
  'Porsche 911 Carrera RS 2.7',
  'Najlegendarniejsze 911. Ikoniczny ducktail.',
  'car', 'rare', 'Porsche', 210, true, false,
  'Porsche', '911 Carrera RS 2.7', 210, 255, 245, 1973,
  '2.7L Boxer 6', 6, 5.8, 1075, 'RWD',
  'Charakterystyczne litery Carrera na boku'
),

-- Porsche 930 Turbo
(
  'Porsche 930 Turbo',
  'Słynny Widowmaker. Pierwsze turbo 911.',
  'car', 'rare', 'Porsche', 300, true, false,
  'Porsche', '911 Turbo (930)', 300, 412, 260, 1978,
  '3.3L Boxer 6 Turbo', 6, 5.0, 1300, 'RWD',
  'Bez intercoolera i z turbo lag - wymagało szacunku'
),

-- BMW E46 M3 CSL
(
  'BMW M3 CSL',
  'Najpurystowniejsze M3. Lżejsze i ostrzejsze.',
  'car', 'rare', 'BMW', 360, true, false,
  'BMW', 'M3 CSL (E46)', 360, 370, 280, 2003,
  '3.2L I6 S54', 6, 4.9, 1385, 'RWD',
  'CSL = Coupe Sport Leichtbau - zrzucono 110 kg'
),

-- Mercedes-Benz 190E 2.5-16 Evo II
(
  'Mercedes-Benz 190E Evo II',
  'Baby Benz do DTM. Ogromne skrzydło.',
  'car', 'rare', 'Mercedes-Benz', 235, true, false,
  'Mercedes-Benz', '190E 2.5-16 Evolution II', 235, 245, 250, 1990,
  '2.5L I4 Cosworth', 4, 7.1, 1340, 'RWD',
  'Tylko 502 sztuki dla homologacji DTM'
),

-- Alfa Romeo GTV6
(
  'Alfa Romeo GTV6',
  'Włoski klasyk z legendarnym V6 Busso.',
  'car', 'rare', 'Alfa Romeo', 160, true, false,
  'Alfa Romeo', 'GTV6 2.5', 160, 217, 220, 1981,
  '2.5L V6 Busso', 6, 8.0, 1150, 'RWD',
  'Silnik Busso V6 to jeden z najpiękniej brzmiących silników'
),

-- Datsun 240Z
(
  'Datsun 240Z',
  'Pierwszy prawdziwy japońśki sportowy samochód.',
  'car', 'rare', 'Datsun', 151, true, false,
  'Datsun', '240Z', 151, 198, 201, 1971,
  '2.4L I6 L24', 6, 8.0, 1069, 'RWD',
  'Sprzedał się lepiej niż wszystkie brytyjskie sportowe razem wzięte'
),

-- Toyota 2000GT
(
  'Toyota 2000GT',
  'Pierwsza japońska egzotyka. Grała w filmie Bonda.',
  'car', 'rare', 'Toyota', 150, true, false,
  'Toyota', '2000GT', 150, 175, 220, 1967,
  '2.0L I6 DOHC Yamaha', 6, 8.6, 1120, 'RWD',
  'Tylko 351 sztuk - najbardziej pożądana Toyota'
),

-- Mazda RX-3
(
  'Mazda RX-3',
  'Klasyczny Wankel w kompaktowym nadwoziu.',
  'car', 'rare', 'Mazda', 130, true, false,
  'Mazda', 'RX-3 (Savanna)', 130, 175, 190, 1973,
  '1.1L Twin Rotor 12A', 2, 8.7, 1000, 'RWD',
  'Zdominowała wyścigi touring carów w Japonii'
),

-- Toyota AE86
(
  'Toyota AE86 Trueno',
  'Król driftu. Legenda Initial D.',
  'car', 'rare', 'Toyota', 130, true, false,
  'Toyota', 'Corolla Levin/Trueno AE86', 130, 149, 194, 1985,
  '1.6L I4 4A-GE', 4, 8.3, 970, 'RWD',
  'Takumi Fujiwara z Initial D jeździł właśnie tym autem'
),

-- Isuzu Piazza Turbo
(
  'Isuzu Piazza Turbo',
  'Zaprojektowane przez Giugiaro. Zapomniana perła.',
  'car', 'rare', 'Isuzu', 180, true, false,
  'Isuzu', 'Piazza Turbo Handling by Lotus', 180, 240, 210, 1988,
  '2.0L I4 Turbo', 4, 7.5, 1215, 'RWD',
  'Zawieszenie strojone przez Lotusa'
),

-- ===========================================
-- COMMON - Klasyki codzienne i japońskie (30 kart)
-- ===========================================

-- Volkswagen Golf Mk1 GTI
(
  'Volkswagen Golf GTI Mk1',
  'Protoplasta hot hatchy. Zmienił motoryzację.',
  'car', 'common', 'Volkswagen', 110, true, false,
  'Volkswagen', 'Golf GTI (Mk1)', 110, 140, 182, 1976,
  '1.6L I4', 4, 9.0, 840, 'FWD',
  'Powstał z inicjatywy inżynierów, nie zarządu'
),

-- Volkswagen Beetle
(
  'Volkswagen Beetle',
  'Garbus. Najdłużej produkowany samochód w historii.',
  'car', 'common', 'Volkswagen', 53, true, false,
  'Volkswagen', 'Beetle 1303', 53, 95, 130, 1973,
  '1.6L Boxer 4', 4, 17.5, 870, 'RWD',
  'Wyprodukowano ponad 21.5 miliona sztuk'
),

-- Ford Escort Mk1
(
  'Ford Escort Mk1 RS',
  'Legendarne rajdówki. Kultowy design.',
  'car', 'common', 'Ford', 120, true, false,
  'Ford', 'Escort RS1600', 120, 150, 180, 1970,
  '1.6L I4 Cosworth BDA', 4, 9.0, 870, 'RWD',
  'Wygrywał rajdy przez całe lata 70'
),

-- Fiat 500
(
  'Fiat 500',
  'Włoska ikona. Cinquecento który zmotoryzował Włochy.',
  'car', 'common', 'Fiat', 18, true, false,
  'Fiat', '500 F', 18, 29, 95, 1968,
  '0.5L I2', 2, 0, 470, 'RWD',
  'Wyprodukowano prawie 4 miliony sztuk'
),

-- Mini Cooper S Classic
(
  'Mini Cooper S Classic',
  'Mały gigant. Wygrywał rajdy z dużymi autami.',
  'car', 'common', 'Mini', 75, true, false,
  'Mini', 'Cooper S Mk3', 75, 103, 160, 1971,
  '1.3L I4', 4, 10.5, 640, 'FWD',
  'Wygrał Monte Carlo Rally 3 razy w latach 60'
),

-- Mazda RX-7 FB
(
  'Mazda RX-7 FB',
  'Pierwsza generacja RX-7. Zaczęła legendę Wankla.',
  'car', 'common', 'Mazda', 130, true, false,
  'Mazda', 'RX-7 (FB)', 130, 160, 190, 1978,
  '1.1L Twin Rotor 12A', 2, 8.6, 1050, 'RWD',
  'Sprzedano ponad pół miliona egzemplarzy pierwszej generacji'
),

-- Mazda RX-7 FC
(
  'Mazda RX-7 FC',
  'Druga generacja RX-7. Turbo i pop-up reflektory.',
  'car', 'common', 'Mazda', 200, true, false,
  'Mazda', 'RX-7 Turbo II (FC)', 200, 265, 235, 1989,
  '1.3L Twin Rotor Turbo 13B', 2, 6.7, 1300, 'RWD',
  'FC3S było bardzo popularne w wyścigach IMSA'
),

-- Honda CRX Si
(
  'Honda CRX Si',
  'Lekki pocket rocket. Radość z jazdy w pigułce.',
  'car', 'common', 'Honda', 135, true, false,
  'Honda', 'CRX Si', 135, 147, 205, 1990,
  '1.6L I4 DOHC VTEC B16A', 4, 7.5, 980, 'FWD',
  'Ważyła mniej niż tonę z rewelacyjnym silnikiem B16A'
),

-- Honda Prelude
(
  'Honda Prelude',
  'Osobiste coupe. Pierwsze auto z 4-kołowym skrętem.',
  'car', 'common', 'Honda', 200, true, false,
  'Honda', 'Prelude Type SH', 200, 218, 225, 1997,
  '2.2L I4 VTEC H22A', 4, 7.0, 1320, 'FWD',
  'ATTS automatycznie rozdzielał moment między koła przednie'
),

-- Toyota Celica GT-Four ST185
(
  'Toyota Celica All-Trac',
  'Wersja przed GT-Four. Dominowała w rajdach.',
  'car', 'common', 'Toyota', 204, true, false,
  'Toyota', 'Celica All-Trac Turbo (ST185)', 204, 294, 230, 1989,
  '2.0L I4 Turbo 3S-GTE', 4, 6.5, 1350, 'AWD',
  'Carlos Sainz wygrał nią WRC w 1990 roku'
),

-- Toyota MR2 SW20
(
  'Toyota MR2',
  'Japońskie Ferrari. Środkowy silnik za grosze.',
  'car', 'common', 'Toyota', 245, true, false,
  'Toyota', 'MR2 Turbo (SW20)', 245, 304, 240, 1991,
  '2.0L I4 Turbo 3S-GTE', 4, 5.8, 1280, 'RWD',
  'Środkowy silnik dawał zachowanie jak w prawdziwym supercarze'
),

-- Nissan 200SX S14
(
  'Nissan 200SX',
  'Japońskie coupe do driftu. Platforma Silvii.',
  'car', 'common', 'Nissan', 200, true, false,
  'Nissan', '200SX (S14)', 200, 275, 235, 1995,
  '2.0L I4 Turbo SR20DET', 4, 6.3, 1270, 'RWD',
  'S14 nazywana Kouki (po face-lifcie) jest bardziej ceniona'
),

-- Mitsubishi Eclipse 2G
(
  'Mitsubishi Eclipse 2G',
  'Druga generacja. Ikona tunerów.',
  'car', 'common', 'Mitsubishi', 210, true, false,
  'Mitsubishi', 'Eclipse GSX (2G)', 210, 305, 228, 1995,
  '2.0L I4 Turbo 4G63', 4, 6.6, 1450, 'AWD',
  'Silnik 4G63 to legenda wśród tunerów'
),

-- Honda del Sol VTEC
(
  'Honda del Sol VTEC',
  'Targa z napędem VTEC. Zabawka na lato.',
  'car', 'common', 'Honda', 160, true, false,
  'Honda', 'del Sol VTEC', 160, 152, 210, 1994,
  '1.6L I4 DOHC VTEC B16A3', 4, 7.1, 1070, 'FWD',
  'Dach można było schować w bagażniku'
),

-- Acura Integra Type R
(
  'Acura Integra Type R',
  'Amerykańska wersja DC2. Kultowy hot hatch.',
  'car', 'common', 'Acura', 195, true, false,
  'Acura', 'Integra Type R (DC2)', 195, 178, 233, 1997,
  '1.8L I4 DOHC VTEC B18C5', 4, 6.2, 1120, 'FWD',
  'Najwyższa moc z litra spośród wolnossących silników swojej ery'
),

-- Ford Probe GT
(
  'Ford Probe GT',
  'Współpraca Forda z Mazdą. Sportowe coupe.',
  'car', 'common', 'Ford', 164, true, false,
  'Ford', 'Probe GT', 164, 203, 215, 1993,
  '2.5L V6 Mazda KL-DE', 6, 8.0, 1320, 'FWD',
  'Bazowało na platformie Mazdy MX-6'
),

-- Chevrolet Cavalier Z24
(
  'Chevrolet Cavalier Z24',
  'Amerykański sport compact lat 90.',
  'car', 'common', 'Chevrolet', 150, true, false,
  'Chevrolet', 'Cavalier Z24', 150, 200, 200, 1996,
  '2.4L I4 Twin Cam', 4, 8.5, 1270, 'FWD',
  'Popularna baza do tuningu w latach 90'
),

-- Dodge Neon SRT-4
(
  'Dodge Neon SRT-4',
  'Turbodoładowany pocket rocket. Street and Racing Technology.',
  'car', 'common', 'Dodge', 230, true, false,
  'Dodge', 'Neon SRT-4', 230, 340, 240, 2003,
  '2.4L I4 Turbo', 4, 5.3, 1380, 'FWD',
  'SRT = Street and Racing Technology'
),

-- Saab 900 Turbo
(
  'Saab 900 Turbo',
  'Szwedzki kultowiec. Turbo i charakter.',
  'car', 'common', 'Saab', 185, true, false,
  'Saab', '900 Turbo SPG', 185, 288, 220, 1989,
  '2.0L I4 Turbo', 4, 7.4, 1290, 'FWD',
  'SPG = Special Performance Group'
),

-- Volvo 850 T-5R
(
  'Volvo 850 T-5R',
  'Żółte kombi które wyścigowało się w BTCC.',
  'car', 'common', 'Volvo', 240, true, false,
  'Volvo', '850 T-5R', 240, 330, 245, 1995,
  '2.3L I5 Turbo', 5, 6.7, 1490, 'FWD',
  'Startowało w BTCC jako kombi i szalało na torach'
),

-- Peugeot 306 S16
(
  'Peugeot 306 S16',
  'Francuski hot hatch. Świetne zawieszenie.',
  'car', 'common', 'Peugeot', 167, true, false,
  'Peugeot', '306 S16', 167, 206, 228, 1993,
  '2.0L I4', 4, 7.5, 1160, 'FWD',
  'Zawieszenie projektowane we współpracy z Lotusem'
),

-- Citroën Saxo VTS
(
  'Citroen Saxo VTS',
  'Mały Francuz z wielkim charakterem.',
  'car', 'common', 'Citroen', 120, true, false,
  'Citroen', 'Saxo VTS 16V', 120, 145, 206, 1997,
  '1.6L I4 16V', 4, 8.0, 980, 'FWD',
  'Bardzo popularne auto w wyścigach cup'
),

-- Opel Kadett GSi
(
  'Opel Kadett GSi',
  'Niemiecki hot hatch lat 80. Konkurent GTI.',
  'car', 'common', 'Opel', 156, true, false,
  'Opel', 'Kadett GSi 16V', 156, 196, 222, 1988,
  '2.0L I4 16V', 4, 7.5, 1050, 'FWD',
  'Czerwona linia 16V na błotnikach była symbolem statusu'
),

-- Ford Capri
(
  'Ford Capri',
  'Europejski Mustang. Kultowy fastback.',
  'car', 'common', 'Ford', 160, true, false,
  'Ford', 'Capri 2.8 Injection', 160, 245, 210, 1981,
  '2.8L V6', 6, 7.9, 1210, 'RWD',
  'Nazywany europejskim Mustangiem'
),

-- Opel Manta
(
  'Opel Manta',
  'Niemieckie sportowe coupe. Konkurent Capri.',
  'car', 'common', 'Opel', 105, true, false,
  'Opel', 'Manta B GSi', 105, 152, 190, 1982,
  '1.8L I4', 4, 10.0, 1020, 'RWD',
  'Manta B ma kultowy status w Niemczech'
),

-- Talbot Sunbeam Lotus
(
  'Talbot Sunbeam Lotus',
  'Rajdowy homologator. Zwycięzca WRC.',
  'car', 'common', 'Talbot', 150, true, false,
  'Talbot', 'Sunbeam Lotus', 150, 200, 195, 1980,
  '2.2L I4 Lotus 16V', 4, 7.4, 960, 'RWD',
  'Wygrał rajd WRC w 1981 roku prowadzony przez Henri Toivonena'
),

-- DeLorean DMC-12
(
  'DeLorean DMC-12',
  'Wehikuł czasu. Gwiazda Powrotu do Przyszłości.',
  'car', 'common', 'DeLorean', 130, true, false,
  'DeLorean', 'DMC-12', 130, 207, 175, 1981,
  '2.8L V6 PRV', 6, 10.5, 1230, 'RWD',
  'Karoseria ze stali nierdzewnej i drzwi gulwingowe'
),

-- Lotus Elan M100
(
  'Lotus Elan',
  'Lekki roadster z napędem FWD. Zaskakujący Lotus.',
  'car', 'common', 'Lotus', 165, true, false,
  'Lotus', 'Elan SE Turbo (M100)', 165, 220, 220, 1989,
  '1.6L I4 Turbo Isuzu', 4, 6.5, 1022, 'FWD',
  'Wyjątkowy przypadek - Lotus z napędem przednim'
),

-- Triumph TR6
(
  'Triumph TR6',
  'Ostatni prawdziwy Triumph. Klasyczny brytyjski roadster.',
  'car', 'common', 'Triumph', 150, true, false,
  'Triumph', 'TR6 PI', 150, 224, 190, 1973,
  '2.5L I6', 6, 8.2, 1117, 'RWD',
  'Najlepiej sprzedający się model Triumpha w USA'
)
ON CONFLICT (name) DO NOTHING;

-- Podsumowanie
SELECT
  'PACK 3 DODANY!' as status,
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
