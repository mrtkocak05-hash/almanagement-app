'use strict'

// id, name, country
const BRANDS = [
  [1,'Alfa Romeo','İtalya'],[2,'Alpine','Fransa'],[3,'Aston Martin','İngiltere'],
  [4,'Audi','Almanya'],[5,'BAIC','Çin'],[6,'Bentley','İngiltere'],
  [7,'BMW','Almanya'],[8,'Bugatti','Fransa'],[9,'BYD','Çin'],
  [10,'Cadillac','ABD'],[11,'Changan','Çin'],[12,'Chery','Çin'],
  [13,'Chevrolet','ABD'],[14,'Chrysler','ABD'],[15,'Citroën','Fransa'],
  [16,'Cupra','İspanya'],[17,'Dacia','Romanya'],[18,'Daewoo','Güney Kore'],
  [19,'Daihatsu','Japonya'],[20,'Dodge','ABD'],
  [21,'DS','Fransa'],[22,'Ferrari','İtalya'],[23,'Fiat','İtalya'],
  [24,'Ford','ABD'],[25,'GAC','Çin'],[26,'Geely','Çin'],
  [27,'Genesis','Güney Kore'],[28,'GMC','ABD'],[29,'Great Wall','Çin'],
  [30,'Haval','Çin'],[31,'Honda','Japonya'],[32,'Hummer','ABD'],
  [33,'Hyundai','Güney Kore'],[34,'Infiniti','Japonya'],[35,'Isuzu','Japonya'],
  [36,'JAC','Çin'],[37,'Jaguar','İngiltere'],[38,'Jeep','ABD'],
  [39,'Kia','Güney Kore'],[40,'Lada','Rusya'],
  [41,'Lamborghini','İtalya'],[42,'Lancia','İtalya'],[43,'Land Rover','İngiltere'],
  [44,'Lexus','Japonya'],[45,'Lincoln','ABD'],[46,'Lotus','İngiltere'],
  [47,'Mahindra','Hindistan'],[48,'Maserati','İtalya'],[49,'Maybach','Almanya'],
  [50,'Mazda','Japonya'],[51,'McLaren','İngiltere'],[52,'Mercedes-Benz','Almanya'],
  [53,'MG','Çin'],[54,'Mini','İngiltere'],[55,'Mitsubishi','Japonya'],
  [56,'NIO','Çin'],[57,'Nissan','Japonya'],[58,'Opel','Almanya'],
  [59,'Pagani','İtalya'],[60,'Peugeot','Fransa'],
  [61,'Porsche','Almanya'],[62,'Proton','Malezya'],[63,'RAM','ABD'],
  [64,'Renault','Fransa'],[65,'Rimac','Hırvatistan'],[66,'Rivian','ABD'],
  [67,'Rolls-Royce','İngiltere'],[68,'Saab','İsveç'],[69,'Samsung','Güney Kore'],
  [70,'Seat','İspanya'],[71,'Skoda','Çek Cumhuriyeti'],[72,'Smart','Almanya'],
  [73,'SsangYong','Güney Kore'],[74,'Subaru','Japonya'],[75,'Suzuki','Japonya'],
  [76,'Tata','Hindistan'],[77,'Tesla','ABD'],[78,'Togg','Türkiye'],
  [79,'Toyota','Japonya'],[80,'UAZ','Rusya'],[81,'Volkswagen','Almanya'],
  [82,'Volvo','İsveç'],[83,'Xpeng','Çin'],[84,'Zeekr','Çin'],
  [85,'Seres','Çin'],[86,'Omoda','Çin'],[87,'Jaecoo','Çin'],
  [88,'Datsun','Japonya'],[89,'Wey','Çin'],[90,'Ora','Çin'],
  [91,'Polestar','İsveç'],[92,'Lynk & Co','Çin'],[93,'Li Auto','Çin'],
  [94,'Huawei Aito','Çin'],[95,'Lucid','ABD'],[96,'Fisker','ABD'],
  [97,'VinFast','Vietnam'],[98,'Tofaş','Türkiye'],[99,'Anadol','Türkiye'],
  [100,'Karsan','Türkiye'],[101,'BMC','Türkiye'],[102,'Otokar','Türkiye'],
]

// [brand_id, model_name]
const MODELS = [
  // BMW (7)
  [7,'1 Serisi'],[7,'2 Serisi'],[7,'3 Serisi'],[7,'4 Serisi'],[7,'5 Serisi'],[7,'6 Serisi'],
  [7,'7 Serisi'],[7,'8 Serisi'],[7,'X1'],[7,'X2'],[7,'X3'],[7,'X4'],[7,'X5'],[7,'X6'],[7,'X7'],
  [7,'M2'],[7,'M3'],[7,'M4'],[7,'M5'],[7,'M8'],[7,'M135i'],[7,'M235i'],[7,'M340i'],
  [7,'i3'],[7,'i4'],[7,'i5'],[7,'i7'],[7,'iX'],[7,'iX1'],[7,'iX3'],[7,'iX5'],
  [7,'Z4'],[7,'2 Serisi Gran Coupe'],[7,'3 Serisi Touring'],[7,'5 Serisi Touring'],
  [7,'6 Serisi Gran Turismo'],[7,'X3 M'],[7,'X5 M'],[7,'XM'],

  // Mercedes-Benz (52)
  [52,'A Serisi'],[52,'B Serisi'],[52,'C Serisi'],[52,'CLA'],[52,'CLS'],[52,'E Serisi'],
  [52,'GLA'],[52,'GLB'],[52,'GLC'],[52,'GLC Coupe'],[52,'GLE'],[52,'GLE Coupe'],[52,'GLS'],
  [52,'G Serisi'],[52,'S Serisi'],[52,'SL'],[52,'SLC'],[52,'AMG GT'],
  [52,'EQA'],[52,'EQB'],[52,'EQC'],[52,'EQE'],[52,'EQE SUV'],[52,'EQS'],[52,'EQS SUV'],
  [52,'V Serisi'],[52,'Vito'],[52,'Sprinter'],[52,'Metris'],[52,'Citan'],
  [52,'A 45 AMG'],[52,'C 63 AMG'],[52,'E 63 AMG'],[52,'S 63 AMG'],[52,'GLE 63 AMG'],
  [52,'CLK'],[52,'ML'],[52,'GL'],[52,'R Serisi'],

  // Audi (4)
  [4,'A1'],[4,'A3'],[4,'A4'],[4,'A5'],[4,'A6'],[4,'A7'],[4,'A8'],
  [4,'Q2'],[4,'Q3'],[4,'Q4 e-tron'],[4,'Q5'],[4,'Q7'],[4,'Q8'],[4,'Q8 e-tron'],
  [4,'TT'],[4,'R8'],[4,'e-tron GT'],[4,'RS3'],[4,'RS4'],[4,'RS5'],[4,'RS6'],[4,'RS7'],
  [4,'S3'],[4,'S4'],[4,'S5'],[4,'S6'],[4,'S7'],[4,'S8'],[4,'SQ5'],[4,'SQ7'],[4,'SQ8'],

  // Volkswagen (81)
  [81,'Polo'],[81,'Golf'],[81,'Golf Plus'],[81,'Golf Variant'],[81,'Golf Alltrack'],
  [81,'Jetta'],[81,'Passat'],[81,'Passat Variant'],[81,'Arteon'],[81,'Phaeton'],
  [81,'T-Cross'],[81,'T-Roc'],[81,'Tiguan'],[81,'Tiguan Allspace'],[81,'Touareg'],
  [81,'Touran'],[81,'Sharan'],[81,'Caddy'],[81,'Transporter'],[81,'Multivan'],
  [81,'ID.3'],[81,'ID.4'],[81,'ID.5'],[81,'ID.6'],[81,'ID.7'],[81,'ID. Buzz'],
  [81,'Up!'],[81,'GTI'],[81,'GTD'],[81,'GTE'],[81,'R'],
  [81,'Crafter'],[81,'Amarok'],[81,'Fox'],[81,'Lupo'],[81,'Scirocco'],[81,'Corrado'],

  // Toyota (79)
  [79,'Aygo'],[79,'Aygo X'],[79,'Yaris'],[79,'Yaris Cross'],[79,'Corolla'],
  [79,'Corolla Cross'],[79,'Auris'],[79,'Avensis'],[79,'Camry'],[79,'Prius'],
  [79,'Prius+'],[79,'C-HR'],[79,'RAV4'],[79,'RAV4 PHEV'],[79,'Highlander'],
  [79,'Land Cruiser'],[79,'Land Cruiser Prado'],[79,'Hilux'],[79,'Proace'],
  [79,'Proace Verso'],[79,'Rush'],[79,'Fortuner'],[79,'Venza'],
  [79,'Supra'],[79,'GR86'],[79,'GR Yaris'],[79,'GR Corolla'],
  [79,'bZ4X'],[79,'bZ3'],[79,'Sequoia'],[79,'Tundra'],
  [79,'Verso'],[79,'Urban Cruiser'],[79,'GT86'],

  // Ford (24)
  [24,'Fiesta'],[24,'Focus'],[24,'Mondeo'],[24,'Galaxy'],[24,'S-Max'],[24,'Puma'],
  [24,'EcoSport'],[24,'Kuga'],[24,'Edge'],[24,'Explorer'],[24,'Mustang'],[24,'Mach-E'],
  [24,'F-150'],[24,'F-150 Lightning'],[24,'Bronco'],[24,'Ranger'],[24,'Transit'],
  [24,'Transit Connect'],[24,'Transit Courier'],[24,'Ka'],[24,'Ka+'],
  [24,'Fusion'],[24,'Taurus'],[24,'Maverick'],

  // Renault (64)
  [64,'Clio'],[64,'Megane'],[64,'Megane E-Tech'],[64,'Megane RS'],[64,'Laguna'],
  [64,'Talisman'],[64,'Zoe'],[64,'Captur'],[64,'Kadjar'],[64,'Koleos'],
  [64,'Austral'],[64,'Arkana'],[64,'Scenic'],[64,'Scenic E-Tech'],[64,'Espace'],
  [64,'Twingo'],[64,'Kangoo'],[64,'Kangoo E-Tech'],[64,'Trafic'],[64,'Master'],
  [64,'5 E-Tech'],[64,'Rafale'],[64,'Mégane IV'],[64,'Vel Satis'],

  // Hyundai (33)
  [33,'i10'],[33,'i20'],[33,'i20 N'],[33,'i30'],[33,'i30 N'],[33,'i40'],[33,'IONIQ'],
  [33,'IONIQ 5'],[33,'IONIQ 6'],[33,'IONIQ 9'],[33,'Kona'],[33,'Kona Electric'],
  [33,'Tucson'],[33,'Santa Fe'],[33,'NEXO'],[33,'Venue'],[33,'Creta'],[33,'Palisade'],
  [33,'Sonata'],[33,'Elantra'],[33,'Azera'],[33,'H-1'],[33,'Staria'],[33,'Bayon'],

  // Kia (39)
  [39,'Picanto'],[39,'Rio'],[39,'Ceed'],[39,'ProCeed'],[39,'Proceed'],
  [39,'Stinger'],[39,'Optima'],[39,'Cerato'],[39,'Soul'],
  [39,'Stonic'],[39,'Xceed'],[39,'Sportage'],[39,'Sorento'],[39,'Telluride'],
  [39,'Niro'],[39,'Niro EV'],[39,'EV6'],[39,'EV9'],[39,'EV3'],
  [39,'Carnival'],[39,'K900'],[39,'Mohave'],

  // Opel (58)
  [58,'Corsa'],[58,'Corsa-e'],[58,'Astra'],[58,'Vectra'],[58,'Insignia'],[58,'Omega'],
  [58,'Mokka'],[58,'Mokka-e'],[58,'Crossland'],[58,'Grandland'],[58,'Grandland X'],
  [58,'Zafira'],[58,'Zafira Life'],[58,'Meriva'],[58,'Agila'],[58,'Adam'],[58,'Cascada'],
  [58,'Combo'],[58,'Vivaro'],[58,'Movano'],[58,'Antara'],

  // Peugeot (60)
  [60,'108'],[60,'208'],[60,'208 e'],[60,'308'],[60,'308 SW'],[60,'408'],[60,'508'],[60,'508 SW'],
  [60,'2008'],[60,'3008'],[60,'5008'],[60,'Rifter'],[60,'Partner'],[60,'Expert'],[60,'Boxer'],
  [60,'106'],[60,'107'],[60,'206'],[60,'207'],[60,'306'],[60,'307'],[60,'405'],[60,'406'],[60,'407'],
  [60,'E-208'],[60,'E-2008'],[60,'E-308'],[60,'E-3008'],[60,'E-5008'],

  // Citroën (15)
  [15,'C1'],[15,'C2'],[15,'C3'],[15,'C3 Aircross'],[15,'C4'],[15,'ë-C4'],[15,'C4 X'],
  [15,'C5'],[15,'C5 X'],[15,'C5 Aircross'],[15,'Berlingo'],[15,'SpaceTourer'],
  [15,'Jumpy'],[15,'Jumper'],[15,'Saxo'],[15,'Xsara'],[15,'ZX'],[15,'Picasso'],

  // Fiat (23)
  [23,'500'],[23,'500X'],[23,'500e'],[23,'500L'],[23,'500C'],[23,'500 Abarth'],
  [23,'Punto'],[23,'Grande Punto'],[23,'Panda'],[23,'Tipo'],[23,'Bravo'],[23,'Brava'],
  [23,'Doblo'],[23,'Egea'],[23,'Egea Cross'],[23,'Egea SW'],
  [23,'Tempra'],[23,'Albea'],[23,'Palio'],[23,'Marea'],[23,'Stilo'],
  [23,'Fiorino'],[23,'Ducato'],[23,'Scudo'],

  // Honda (31)
  [31,'Jazz'],[31,'Jazz e:HEV'],[31,'Civic'],[31,'Civic e:HEV'],[31,'Accord'],[31,'Legend'],
  [31,'HR-V'],[31,'CR-V'],[31,'CR-V e:PHEV'],[31,'ZR-V'],[31,'Pilot'],[31,'Ridgeline'],
  [31,'Element'],[31,'Stream'],[31,'FR-V'],[31,'Odyssey'],[31,'e'],[31,'e:Ny1'],
  [31,'CR-Z'],[31,'S2000'],[31,'Prelude'],[31,'NSX'],

  // Nissan (57)
  [57,'Micra'],[57,'Juke'],[57,'Note'],[57,'Tiida'],[57,'Almera'],[57,'Sentra'],
  [57,'Altima'],[57,'Maxima'],[57,'Qashqai'],[57,'X-Trail'],[57,'Pathfinder'],
  [57,'Navara'],[57,'Patrol'],[57,'Ariya'],[57,'Leaf'],[57,'GT-R'],
  [57,'370Z'],[57,'400Z'],[57,'Primera'],[57,'Sunny'],[57,'Bluebird'],
  [57,'Pulsar'],[57,'Murano'],[57,'Kicks'],[57,'Terra'],

  // Mitsubishi (55)
  [55,'Colt'],[55,'Lancer'],[55,'Lancer Evolution'],[55,'Galant'],[55,'Grandis'],
  [55,'Eclipse Cross'],[55,'Eclipse Cross PHEV'],[55,'ASX'],[55,'Outlander'],
  [55,'Outlander PHEV'],[55,'L200'],[55,'Pajero'],[55,'Pajero Sport'],
  [55,'Space Star'],[55,'Space Wagon'],

  // Mazda (50)
  [50,'Mazda2'],[50,'Mazda3'],[50,'Mazda6'],[50,'MX-5'],[50,'MX-30'],
  [50,'CX-3'],[50,'CX-30'],[50,'CX-5'],[50,'CX-60'],[50,'CX-80'],[50,'CX-90'],
  [50,'RX-8'],[50,'323'],[50,'626'],

  // Subaru (74)
  [74,'Impreza'],[74,'Legacy'],[74,'Outback'],[74,'Forester'],[74,'XV'],[74,'Crosstrek'],
  [74,'BRZ'],[74,'WRX'],[74,'WRX STI'],[74,'Levorg'],[74,'Solterra'],[74,'Ascent'],

  // Suzuki (75)
  [75,'Alto'],[75,'Swift'],[75,'Swift Sport'],[75,'Celerio'],[75,'Baleno'],[75,'Ciaz'],
  [75,'Ignis'],[75,'Vitara'],[75,'S-Cross'],[75,'Jimny'],[75,'Grand Vitara'],[75,'Across'],
  [75,'Swace'],[75,'Wagon R'],[75,'SX4'],[75,'Splash'],

  // Seat (70)
  [70,'Ibiza'],[70,'Leon'],[70,'Leon FR'],[70,'Toledo'],[70,'Arona'],[70,'Ateca'],[70,'Tarraco'],
  [70,'Mii'],[70,'Alhambra'],[70,'Altea'],[70,'Exeo'],

  // Skoda (71)
  [71,'Fabia'],[71,'Scala'],[71,'Octavia'],[71,'Octavia Combi'],[71,'Superb'],[71,'Superb Combi'],
  [71,'Rapid'],[71,'Kamiq'],[71,'Karoq'],[71,'Kodiaq'],[71,'Enyaq'],[71,'Enyaq Coupe'],
  [71,'Citigo'],[71,'Roomster'],[71,'Yeti'],[71,'Felicia'],

  // Dacia (17)
  [17,'Sandero'],[17,'Sandero Stepway'],[17,'Logan'],[17,'Logan MCV'],[17,'Duster'],
  [17,'Spring'],[17,'Jogger'],[17,'Lodgy'],[17,'Dokker'],[17,'Bigster'],

  // Volvo (82)
  [82,'S60'],[82,'S90'],[82,'V60'],[82,'V60 Cross Country'],[82,'V90'],[82,'V90 Cross Country'],
  [82,'XC40'],[82,'XC60'],[82,'XC90'],[82,'C40 Recharge'],[82,'EX30'],[82,'EX40'],[82,'EX90'],
  [82,'240'],[82,'850'],

  // Land Rover (43)
  [43,'Range Rover'],[43,'Range Rover Sport'],[43,'Range Rover Velar'],[43,'Range Rover Evoque'],
  [43,'Discovery'],[43,'Discovery Sport'],[43,'Defender'],[43,'Freelander'],

  // Jaguar (37)
  [37,'XE'],[37,'XF'],[37,'XJ'],[37,'F-Type'],[37,'E-Pace'],[37,'F-Pace'],[37,'I-Pace'],

  // Porsche (61)
  [61,'911'],[61,'718 Boxster'],[61,'718 Cayman'],[61,'Panamera'],[61,'Macan'],
  [61,'Cayenne'],[61,'Taycan'],[61,'Taycan Cross Turismo'],

  // Tesla (77)
  [77,'Model 3'],[77,'Model S'],[77,'Model X'],[77,'Model Y'],[77,'Cybertruck'],[77,'Roadster'],

  // Lexus (44)
  [44,'IS'],[44,'ES'],[44,'GS'],[44,'LS'],[44,'UX'],[44,'NX'],[44,'RX'],[44,'GX'],[44,'LX'],
  [44,'RC'],[44,'LC'],[44,'LBX'],[44,'TX'],

  // Alfa Romeo (1)
  [1,'Giulia'],[1,'Stelvio'],[1,'Tonale'],[1,'Giulietta'],[1,'147'],[1,'156'],
  [1,'159'],[1,'GT'],[1,'GTV'],[1,'Spider'],[1,'Brera'],[1,'Mito'],

  // Maserati (48)
  [48,'Ghibli'],[48,'Quattroporte'],[48,'Levante'],[48,'GranTurismo'],[48,'GranCabrio'],
  [48,'Grecale'],[48,'MC20'],

  // Ferrari (22)
  [22,'458 Italia'],[22,'488 GTB'],[22,'488 Spider'],[22,'Roma'],[22,'Portofino'],
  [22,'SF90 Stradale'],[22,'F8 Tributo'],[22,'GTC4Lusso'],[22,'296 GTB'],
  [22,'812 Superfast'],[22,'812 GTS'],[22,'Purosangue'],[22,'F40'],[22,'F50'],[22,'Enzo'],

  // Lamborghini (41)
  [41,'Huracán'],[41,'Huracán EVO'],[41,'Urus'],[41,'Urus S'],[41,'Aventador'],[41,'Revuelto'],

  // Jeep (38)
  [38,'Renegade'],[38,'Compass'],[38,'Cherokee'],[38,'Grand Cherokee'],[38,'Grand Cherokee L'],
  [38,'Wrangler'],[38,'Gladiator'],[38,'Commander'],[38,'Avenger'],

  // Chevrolet (13)
  [13,'Spark'],[13,'Aveo'],[13,'Cruze'],[13,'Malibu'],[13,'Impala'],[13,'Camaro'],
  [13,'Corvette'],[13,'Tahoe'],[13,'Suburban'],[13,'Silverado'],[13,'Equinox'],
  [13,'Traverse'],[13,'Trailblazer'],[13,'Blazer'],[13,'Trax'],

  // Aston Martin (3)
  [3,'DB11'],[3,'DBS'],[3,'Vantage'],[3,'DBX'],[3,'Valkyrie'],[3,'DB12'],

  // Rolls-Royce (67)
  [67,'Ghost'],[67,'Phantom'],[67,'Wraith'],[67,'Dawn'],[67,'Cullinan'],[67,'Spectre'],

  // Bentley (6)
  [6,'Continental GT'],[6,'Flying Spur'],[6,'Bentayga'],[6,'Mulsanne'],

  // Cupra (16)
  [16,'Formentor'],[16,'Born'],[16,'Ateca'],[16,'Leon'],[16,'Tavascan'],

  // Togg (78)
  [78,'T10X'],[78,'T10F'],

  // Mini (54)
  [54,'3 Kapı'],[54,'5 Kapı'],[54,'Cabrio'],[54,'Coupe'],[54,'Roadster'],[54,'Paceman'],
  [54,'Countryman'],[54,'Clubman'],[54,'Hatch'],[54,'Electric'],[54,'Aceman'],

  // Smart (72)
  [72,'ForTwo'],[72,'ForFour'],[72,'#1'],[72,'#3'],

  // DS (21)
  [21,'DS3'],[21,'DS4'],[21,'DS5'],[21,'DS7'],[21,'DS9'],

  // Genesis (27)
  [27,'G70'],[27,'G80'],[27,'G90'],[27,'GV70'],[27,'GV80'],[27,'GV60'],

  // SsangYong / KG Mobility (73)
  [73,'Tivoli'],[73,'Korando'],[73,'Rexton'],[73,'Musso'],[73,'Torres'],[73,'Actyon'],

  // Lada (40)
  [40,'Niva'],[40,'Niva Travel'],[40,'Granta'],[40,'Vesta'],[40,'Largus'],

  // Polestar (91)
  [91,'Polestar 2'],[91,'Polestar 3'],[91,'Polestar 4'],

  // Tofaş (98)
  [98,'Şahin'],[98,'Doğan'],[98,'Kartal'],[98,'Tempra'],[98,'Palio'],[98,'Albea'],[98,'Linea'],
]

// Versions / Trim levels
const VERSIONS = [
  'Standart','Entry','Base','Life','Feel','Shine','Style','Active','Active Plus',
  'Comfort','Comfortline','Trendline','Trend','Allstar','Advance','Urban',
  'Elegance','Executive','Prestige','Premium','Luxury','Limited','Exclusive','Platinum',
  'Business','Business Edition','Business Line',
  'Sport','Sport Line','Sportline','SR','SR Plus','Dynamic',
  'Elite','Titanium','Icon','Expression','Iconic','Techno','Allure','Flair',
  'Adventure','Rubicon','Sahara','Trailhawk',
  'M Sport','M Sport Pro','M Performance','M Competition',
  'AMG Line','AMG Night','AMG Plus',
  'S Line','Black Edition',
  'GTI','GTD','GTE','R-Line','Highline',
  'Cross','Cross Plus','Stepway',
  'EX','GLS','GLX','AX','LX','EL','SE','EX Plus',
  'Ghia','Titanium X','ST','ST-Line',
  'HEV','PHEV','BEV',
  'Plus','Max','Pro',
  'Individual','Avantgarde','Ambiente','Aksiyon',
]

// Fuels
const FUELS = [
  { name:'Benzin', sort_order:1 },
  { name:'Dizel', sort_order:2 },
  { name:'LPG', sort_order:3 },
  { name:'Benzin + LPG', sort_order:4 },
  { name:'Hibrit', sort_order:5 },
  { name:'Plug-in Hibrit', sort_order:6 },
  { name:'Elektrik', sort_order:7 },
  { name:'Hidrojen', sort_order:8 },
  { name:'Doğalgaz (CNG)', sort_order:9 },
]

// Transmissions
const TRANSMISSIONS = [
  { name:'Manuel', sort_order:1 },
  { name:'Otomatik', sort_order:2 },
  { name:'Yarı Otomatik', sort_order:3 },
  { name:'DSG / DCT', sort_order:4 },
  { name:'CVT', sort_order:5 },
  { name:'AMT', sort_order:6 },
]

// Body types
const BODY_TYPES = [
  { name:'Sedan', sort_order:1 },
  { name:'Hatchback', sort_order:2 },
  { name:'Station Wagon / Kombi', sort_order:3 },
  { name:'SUV', sort_order:4 },
  { name:'Crossover', sort_order:5 },
  { name:'Coupe', sort_order:6 },
  { name:'Cabriolet / Convertible', sort_order:7 },
  { name:'Minivan / MPV', sort_order:8 },
  { name:'Pickup', sort_order:9 },
  { name:'Van / Minibüs', sort_order:10 },
  { name:'Roadster', sort_order:11 },
  { name:'Fastback', sort_order:12 },
]

// Drive types
const DRIVE_TYPES = [
  { name:'FWD (Önden Çekiş)', sort_order:1 },
  { name:'RWD (Arkadan İtiş)', sort_order:2 },
  { name:'4WD / 4x4', sort_order:3 },
  { name:'AWD (Tam Zamanlı 4x4)', sort_order:4 },
]

// Colors
const COLORS = [
  { name:'Beyaz', hex_code:'#FFFFFF', sort_order:1 },
  { name:'İnci Beyaz', hex_code:'#F0EDE8', sort_order:2 },
  { name:'Şampanya', hex_code:'#F7E7CE', sort_order:3 },
  { name:'Krem / Bej', hex_code:'#F5F0E0', sort_order:4 },
  { name:'Gümüş', hex_code:'#C0C0C0', sort_order:5 },
  { name:'Açık Gri', hex_code:'#D3D3D3', sort_order:6 },
  { name:'Gri', hex_code:'#808080', sort_order:7 },
  { name:'Koyu Gri', hex_code:'#555555', sort_order:8 },
  { name:'Antrasit', hex_code:'#384046', sort_order:9 },
  { name:'Metalik Gri', hex_code:'#636363', sort_order:10 },
  { name:'Siyah', hex_code:'#0A0A0A', sort_order:11 },
  { name:'Gece Siyahı', hex_code:'#1A1A2E', sort_order:12 },
  { name:'Kırmızı', hex_code:'#CC0000', sort_order:13 },
  { name:'Bordo', hex_code:'#800020', sort_order:14 },
  { name:'Kiremit', hex_code:'#A0522D', sort_order:15 },
  { name:'Turuncu', hex_code:'#FF6600', sort_order:16 },
  { name:'Sarı', hex_code:'#FFD700', sort_order:17 },
  { name:'Altın', hex_code:'#CFB53B', sort_order:18 },
  { name:'Bronz', hex_code:'#CD7F32', sort_order:19 },
  { name:'Kahverengi', hex_code:'#8B4513', sort_order:20 },
  { name:'Yeşil', hex_code:'#006400', sort_order:21 },
  { name:'Haki / Zeytin', hex_code:'#6B7645', sort_order:22 },
  { name:'Mavi', hex_code:'#0000CC', sort_order:23 },
  { name:'Lacivert', hex_code:'#000080', sort_order:24 },
  { name:'Açık Mavi', hex_code:'#4682B4', sort_order:25 },
  { name:'Gök Mavisi', hex_code:'#00BFFF', sort_order:26 },
  { name:'Petrol Mavisi', hex_code:'#005F73', sort_order:27 },
  { name:'Mor', hex_code:'#6A0DAD', sort_order:28 },
  { name:'Pembe', hex_code:'#FFC0CB', sort_order:29 },
  { name:'Sedef / Kaktüs', hex_code:'#82B174', sort_order:30 },
]

// Currencies
const CURRENCIES = [
  { code:'TRY', name:'Türk Lirası', symbol:'₺', sort_order:1 },
  { code:'USD', name:'Amerikan Doları', symbol:'$', sort_order:2 },
  { code:'EUR', name:'Euro', symbol:'€', sort_order:3 },
  { code:'GBP', name:'İngiliz Sterlini', symbol:'£', sort_order:4 },
  { code:'CHF', name:'İsviçre Frangı', symbol:'Fr', sort_order:5 },
  { code:'JPY', name:'Japon Yeni', symbol:'¥', sort_order:6 },
  { code:'CNY', name:'Çin Yuanı', symbol:'¥', sort_order:7 },
  { code:'KWD', name:'Kuveyt Dinarı', symbol:'KD', sort_order:8 },
  { code:'AED', name:'BAE Dirhemi', symbol:'AED', sort_order:9 },
  { code:'SAR', name:'Suudi Riyali', symbol:'SR', sort_order:10 },
  { code:'CAD', name:'Kanada Doları', symbol:'CA$', sort_order:11 },
  { code:'AUD', name:'Avustralya Doları', symbol:'A$', sort_order:12 },
  { code:'RUB', name:'Rus Rublesi', symbol:'₽', sort_order:13 },
  { code:'SEK', name:'İsveç Kronası', symbol:'kr', sort_order:14 },
  { code:'NOK', name:'Norveç Kronası', symbol:'kr', sort_order:15 },
  { code:'DKK', name:'Danimarka Kronası', symbol:'kr', sort_order:16 },
  { code:'PLN', name:'Polonya Zlotı', symbol:'zł', sort_order:17 },
  { code:'HUF', name:'Macar Forinti', symbol:'Ft', sort_order:18 },
  { code:'CZK', name:'Çek Korunası', symbol:'Kč', sort_order:19 },
  { code:'RON', name:'Rumen Leyi', symbol:'lei', sort_order:20 },
]

// 81 Turkish provinces with all districts
// Format: [plate_code, 'district_name']
const DISTRICTS = [
  // 01 Adana
  [1,'Aladağ'],[1,'Ceyhan'],[1,'Çukurova'],[1,'Feke'],[1,'İmamoğlu'],[1,'Karaisalı'],
  [1,'Karataş'],[1,'Kozan'],[1,'Pozantı'],[1,'Saimbeyli'],[1,'Sarıçam'],[1,'Seyhan'],
  [1,'Tufanbeyli'],[1,'Yumurtalık'],[1,'Yüreğir'],
  // 02 Adıyaman
  [2,'Besni'],[2,'Çelikhan'],[2,'Gerger'],[2,'Gölbaşı'],[2,'Kahta'],[2,'Merkez'],
  [2,'Samsat'],[2,'Sincik'],[2,'Tut'],
  // 03 Afyonkarahisar
  [3,'Başmakçı'],[3,'Bayat'],[3,'Bolvadin'],[3,'Çay'],[3,'Çobanlar'],[3,'Dazkırı'],
  [3,'Dinar'],[3,'Emirdağ'],[3,'Evciler'],[3,'Hocalar'],[3,'İhsaniye'],[3,'İscehisar'],
  [3,'Kızılören'],[3,'Merkez'],[3,'Sandıklı'],[3,'Sinanpaşa'],[3,'Sultandağı'],[3,'Şuhut'],
  // 04 Ağrı
  [4,'Diyadin'],[4,'Doğubayazıt'],[4,'Eleşkirt'],[4,'Hamur'],[4,'Merkez'],
  [4,'Patnos'],[4,'Taşlıçay'],[4,'Tutak'],
  // 05 Amasya
  [5,'Göynücek'],[5,'Gümüşhacıköy'],[5,'Hamamözü'],[5,'Merkez'],[5,'Merzifon'],
  [5,'Suluova'],[5,'Taşova'],
  // 06 Ankara
  [6,'Akyurt'],[6,'Altındağ'],[6,'Ayaş'],[6,'Bala'],[6,'Beypazarı'],[6,'Çamlıdere'],
  [6,'Çankaya'],[6,'Çubuk'],[6,'Elmadağ'],[6,'Etimesgut'],[6,'Evren'],[6,'Gölbaşı'],
  [6,'Güdül'],[6,'Haymana'],[6,'Kahramankazan'],[6,'Kalecik'],[6,'Keçiören'],
  [6,'Kızılcahamam'],[6,'Mamak'],[6,'Nallıhan'],[6,'Polatlı'],[6,'Pursaklar'],
  [6,'Sincan'],[6,'Şereflikoçhisar'],[6,'Yenimahalle'],
  // 07 Antalya
  [7,'Akseki'],[7,'Aksu'],[7,'Alanya'],[7,'Demre'],[7,'Döşemealtı'],[7,'Elmalı'],
  [7,'Finike'],[7,'Gazipaşa'],[7,'Gündoğmuş'],[7,'İbradı'],[7,'Kaş'],[7,'Kemer'],
  [7,'Kepez'],[7,'Konyaaltı'],[7,'Korkuteli'],[7,'Kumluca'],[7,'Manavgat'],
  [7,'Muratpaşa'],[7,'Serik'],
  // 08 Artvin
  [8,'Ardanuç'],[8,'Arhavi'],[8,'Borçka'],[8,'Hopa'],[8,'Kemalpaşa'],[8,'Merkez'],
  [8,'Murgul'],[8,'Şavşat'],[8,'Yusufeli'],
  // 09 Aydın
  [9,'Bozdoğan'],[9,'Buharkent'],[9,'Çine'],[9,'Didim'],[9,'Efeler'],[9,'Germencik'],
  [9,'İncirliova'],[9,'Karacasu'],[9,'Karpuzlu'],[9,'Koçarlı'],[9,'Köşk'],
  [9,'Kuşadası'],[9,'Kuyucak'],[9,'Nazilli'],[9,'Söke'],[9,'Sultanhisar'],[9,'Yenipazar'],
  // 10 Balıkesir
  [10,'Altıeylül'],[10,'Ayvalık'],[10,'Balya'],[10,'Bandırma'],[10,'Bigadiç'],
  [10,'Burhaniye'],[10,'Dursunbey'],[10,'Edremit'],[10,'Erdek'],[10,'Gömeç'],
  [10,'Gönen'],[10,'Havran'],[10,'İvrindi'],[10,'Karesi'],[10,'Kepsut'],
  [10,'Manyas'],[10,'Marmara'],[10,'Savaştepe'],[10,'Sındırgı'],[10,'Susurluk'],
  // 11 Bilecik
  [11,'Bozüyük'],[11,'Gölpazarı'],[11,'İnhisar'],[11,'Merkez'],[11,'Osmaneli'],
  [11,'Pazaryeri'],[11,'Söğüt'],[11,'Yenipazar'],
  // 12 Bingöl
  [12,'Adaklı'],[12,'Genç'],[12,'Karlıova'],[12,'Kiğı'],[12,'Merkez'],
  [12,'Solhan'],[12,'Yayladere'],[12,'Yedisu'],
  // 13 Bitlis
  [13,'Adilcevaz'],[13,'Ahlat'],[13,'Güroymak'],[13,'Hizan'],[13,'Merkez'],
  [13,'Mutki'],[13,'Tatvan'],
  // 14 Bolu
  [14,'Dörtdivan'],[14,'Gerede'],[14,'Göynük'],[14,'Kıbrıscık'],[14,'Mengen'],
  [14,'Merkez'],[14,'Mudurnu'],[14,'Seben'],[14,'Yeniçağa'],
  // 15 Burdur
  [15,'Ağlasun'],[15,'Altınyayla'],[15,'Bucak'],[15,'Çavdır'],[15,'Çeltikçi'],
  [15,'Gölhisar'],[15,'Karamanlı'],[15,'Kemer'],[15,'Merkez'],[15,'Tefenni'],[15,'Yeşilova'],
  // 16 Bursa
  [16,'Büyükorhan'],[16,'Gemlik'],[16,'Gürsu'],[16,'Harmancık'],[16,'İnegöl'],
  [16,'İznik'],[16,'Karacabey'],[16,'Keles'],[16,'Kestel'],[16,'Mudanya'],
  [16,'Mustafakemalpaşa'],[16,'Nilüfer'],[16,'Orhaneli'],[16,'Orhangazi'],
  [16,'Osmangazi'],[16,'Yenişehir'],[16,'Yıldırım'],
  // 17 Çanakkale
  [17,'Ayvacık'],[17,'Bayramiç'],[17,'Biga'],[17,'Bozcaada'],[17,'Çan'],
  [17,'Eceabat'],[17,'Ezine'],[17,'Gelibolu'],[17,'Gökçeada'],[17,'Lapseki'],
  [17,'Merkez'],[17,'Yenice'],
  // 18 Çankırı
  [18,'Atkaracalar'],[18,'Bayramören'],[18,'Çerkeş'],[18,'Eldivan'],[18,'Ilgaz'],
  [18,'Kızılırmak'],[18,'Korgun'],[18,'Kurşunlu'],[18,'Merkez'],[18,'Orta'],
  [18,'Şabanözü'],[18,'Yapraklı'],
  // 19 Çorum
  [19,'Alaca'],[19,'Bayat'],[19,'Boğazkale'],[19,'Dodurga'],[19,'İskilip'],
  [19,'Kargı'],[19,'Laçin'],[19,'Mecitözü'],[19,'Merkez'],[19,'Oğuzlar'],
  [19,'Ortaköy'],[19,'Osmancık'],[19,'Sungurlu'],[19,'Uğurludağ'],
  // 20 Denizli
  [20,'Acıpayam'],[20,'Babadağ'],[20,'Baklan'],[20,'Bekilli'],[20,'Beyağaç'],
  [20,'Bozkurt'],[20,'Buldan'],[20,'Çal'],[20,'Çameli'],[20,'Çardak'],
  [20,'Çivril'],[20,'Güney'],[20,'Honaz'],[20,'Kale'],[20,'Merkezefendi'],
  [20,'Pamukkale'],[20,'Sarayköy'],[20,'Serinhisar'],[20,'Tavas'],
  // 21 Diyarbakır
  [21,'Bağlar'],[21,'Bismil'],[21,'Çermik'],[21,'Çınar'],[21,'Çüngüş'],
  [21,'Dicle'],[21,'Eğil'],[21,'Ergani'],[21,'Hani'],[21,'Hazro'],
  [21,'Kayapınar'],[21,'Kocaköy'],[21,'Kulp'],[21,'Lice'],[21,'Merkez'],
  [21,'Silvan'],[21,'Sur'],[21,'Yenişehir'],
  // 22 Edirne
  [22,'Enez'],[22,'Havsa'],[22,'İpsala'],[22,'Keşan'],[22,'Lalapaşa'],
  [22,'Meriç'],[22,'Merkez'],[22,'Süloğlu'],[22,'Uzunköprü'],
  // 23 Elazığ
  [23,'Ağın'],[23,'Alacakaya'],[23,'Arıcak'],[23,'Baskil'],[23,'Karakoçan'],
  [23,'Keban'],[23,'Kovancılar'],[23,'Maden'],[23,'Merkez'],[23,'Palu'],[23,'Sivrice'],
  // 24 Erzincan
  [24,'Çayırlı'],[24,'İliç'],[24,'Kemah'],[24,'Kemaliye'],[24,'Merkez'],
  [24,'Otlukbeli'],[24,'Refahiye'],[24,'Tercan'],[24,'Üzümlü'],
  // 25 Erzurum
  [25,'Aşkale'],[25,'Aziziye'],[25,'Çat'],[25,'Hınıs'],[25,'Horasan'],
  [25,'İspir'],[25,'Karaçoban'],[25,'Karayazı'],[25,'Köprüköy'],[25,'Narman'],
  [25,'Oltu'],[25,'Olur'],[25,'Palandöken'],[25,'Pasinler'],[25,'Pazaryolu'],
  [25,'Şenkaya'],[25,'Tekman'],[25,'Tortum'],[25,'Uzundere'],[25,'Yakutiye'],
  // 26 Eskişehir
  [26,'Alpu'],[26,'Beylikova'],[26,'Çifteler'],[26,'Günyüzü'],[26,'Han'],
  [26,'İnönü'],[26,'Mahmudiye'],[26,'Mihalgazi'],[26,'Mihallıçcık'],[26,'Odunpazarı'],
  [26,'Sarıcakaya'],[26,'Seyitgazi'],[26,'Sivrihisar'],[26,'Tepebaşı'],
  // 27 Gaziantep
  [27,'Araban'],[27,'İslahiye'],[27,'Karkamış'],[27,'Nizip'],[27,'Nurdağı'],
  [27,'Oğuzeli'],[27,'Şahinbey'],[27,'Şehitkamil'],[27,'Yavuzeli'],
  // 28 Giresun
  [28,'Alucra'],[28,'Bulancak'],[28,'Çamoluk'],[28,'Çanakçı'],[28,'Dereli'],
  [28,'Doğankent'],[28,'Espiye'],[28,'Eynesil'],[28,'Görele'],[28,'Güce'],
  [28,'Keşap'],[28,'Merkez'],[28,'Piraziz'],[28,'Şebinkarahisar'],[28,'Tirebolu'],
  [28,'Yağlıdere'],
  // 29 Gümüşhane
  [29,'Kelkit'],[29,'Köse'],[29,'Kürtün'],[29,'Merkez'],[29,'Şiran'],[29,'Torul'],
  // 30 Hakkari
  [30,'Çukurca'],[30,'Derecik'],[30,'Merkez'],[30,'Şemdinli'],[30,'Yüksekova'],
  // 31 Hatay
  [31,'Altınözü'],[31,'Antakya'],[31,'Arsuz'],[31,'Belen'],[31,'Defne'],
  [31,'Dörtyol'],[31,'Erzin'],[31,'Hassa'],[31,'İskenderun'],[31,'Kırıkhan'],
  [31,'Kumlu'],[31,'Payas'],[31,'Reyhanlı'],[31,'Samandağ'],[31,'Yayladağı'],
  // 32 Isparta
  [32,'Aksu'],[32,'Atabey'],[32,'Eğirdir'],[32,'Gelendost'],[32,'Gönen'],
  [32,'Keçiborlu'],[32,'Merkez'],[32,'Senirkent'],[32,'Sütçüler'],
  [32,'Şarkikaraağaç'],[32,'Uluborlu'],[32,'Yalvaç'],[32,'Yenişarbademli'],
  // 33 Mersin
  [33,'Akdeniz'],[33,'Anamur'],[33,'Aydıncık'],[33,'Bozyazı'],[33,'Çamlıyayla'],
  [33,'Erdemli'],[33,'Gülnar'],[33,'Mezitli'],[33,'Mut'],[33,'Silifke'],
  [33,'Tarsus'],[33,'Toroslar'],[33,'Yenişehir'],
  // 34 İstanbul
  [34,'Adalar'],[34,'Arnavutköy'],[34,'Ataşehir'],[34,'Avcılar'],[34,'Bağcılar'],
  [34,'Bahçelievler'],[34,'Bakırköy'],[34,'Başakşehir'],[34,'Bayrampaşa'],[34,'Beşiktaş'],
  [34,'Beykoz'],[34,'Beylikdüzü'],[34,'Beyoğlu'],[34,'Büyükçekmece'],[34,'Çatalca'],
  [34,'Çekmeköy'],[34,'Esenler'],[34,'Esenyurt'],[34,'Eyüpsultan'],[34,'Fatih'],
  [34,'Gaziosmanpaşa'],[34,'Güngören'],[34,'Kadıköy'],[34,'Kağıthane'],[34,'Kartal'],
  [34,'Küçükçekmece'],[34,'Maltepe'],[34,'Pendik'],[34,'Sancaktepe'],[34,'Sarıyer'],
  [34,'Silivri'],[34,'Sultanbeyli'],[34,'Sultangazi'],[34,'Şile'],[34,'Şişli'],
  [34,'Tuzla'],[34,'Ümraniye'],[34,'Üsküdar'],[34,'Zeytinburnu'],
  // 35 İzmir
  [35,'Aliağa'],[35,'Balçova'],[35,'Bayındır'],[35,'Bayraklı'],[35,'Bergama'],
  [35,'Beydağ'],[35,'Bornova'],[35,'Buca'],[35,'Çeşme'],[35,'Çiğli'],
  [35,'Dikili'],[35,'Foça'],[35,'Gaziemir'],[35,'Güzelbahçe'],[35,'Karabağlar'],
  [35,'Karaburun'],[35,'Karşıyaka'],[35,'Kemalpaşa'],[35,'Kınık'],[35,'Kiraz'],
  [35,'Konak'],[35,'Menderes'],[35,'Menemen'],[35,'Narlıdere'],[35,'Ödemiş'],
  [35,'Seferihisar'],[35,'Selçuk'],[35,'Tire'],[35,'Torbalı'],[35,'Urla'],
  // 36 Kars
  [36,'Akyaka'],[36,'Arpaçay'],[36,'Digor'],[36,'Kağızman'],[36,'Merkez'],
  [36,'Sarıkamış'],[36,'Selim'],[36,'Susuz'],
  // 37 Kastamonu
  [37,'Abana'],[37,'Ağlı'],[37,'Araç'],[37,'Azdavay'],[37,'Bozkurt'],[37,'Cide'],
  [37,'Çatalzeytin'],[37,'Daday'],[37,'Devrekani'],[37,'Doğanyurt'],[37,'Hanönü'],
  [37,'İhsangazi'],[37,'İnebolu'],[37,'Küre'],[37,'Merkez'],[37,'Pınarbaşı'],
  [37,'Seydiler'],[37,'Şenpazar'],[37,'Taşköprü'],[37,'Tosya'],
  // 38 Kayseri
  [38,'Akkışla'],[38,'Bünyan'],[38,'Develi'],[38,'Felahiye'],[38,'Hacılar'],
  [38,'İncesu'],[38,'Kocasinan'],[38,'Melikgazi'],[38,'Özvatan'],[38,'Pınarbaşı'],
  [38,'Sarıoğlan'],[38,'Sarız'],[38,'Talas'],[38,'Tomarza'],[38,'Yahyalı'],[38,'Yeşilhisar'],
  // 39 Kırklareli
  [39,'Babaeski'],[39,'Demirköy'],[39,'Kofçaz'],[39,'Lüleburgaz'],[39,'Merkez'],
  [39,'Pehlivanköy'],[39,'Pınarhisar'],[39,'Vize'],
  // 40 Kırşehir
  [40,'Akçakent'],[40,'Akpınar'],[40,'Boztepe'],[40,'Çiçekdağı'],[40,'Kaman'],
  [40,'Merkez'],[40,'Mucur'],
  // 41 Kocaeli
  [41,'Başiskele'],[41,'Çayırova'],[41,'Darıca'],[41,'Derince'],[41,'Dilovası'],
  [41,'Gebze'],[41,'Gölcük'],[41,'İzmit'],[41,'Kandıra'],[41,'Karamürsel'],
  [41,'Kartepe'],[41,'Körfez'],
  // 42 Konya
  [42,'Ahırlı'],[42,'Akören'],[42,'Akşehir'],[42,'Altınekin'],[42,'Beyşehir'],
  [42,'Bozkır'],[42,'Cihanbeyli'],[42,'Çeltik'],[42,'Çumra'],[42,'Derbent'],
  [42,'Derebucak'],[42,'Doğanhisar'],[42,'Emirgazi'],[42,'Ereğli'],[42,'Güneysinir'],
  [42,'Hadim'],[42,'Halkapınar'],[42,'Hüyük'],[42,'Ilgın'],[42,'Kadınhanı'],
  [42,'Karapınar'],[42,'Karatay'],[42,'Kulu'],[42,'Meram'],[42,'Sarayönü'],
  [42,'Selçuklu'],[42,'Seydişehir'],[42,'Taşkent'],[42,'Tuzlukçu'],[42,'Yalıhüyük'],[42,'Yunak'],
  // 43 Kütahya
  [43,'Altıntaş'],[43,'Aslanapa'],[43,'Çavdarhisar'],[43,'Domaniç'],[43,'Dumlupınar'],
  [43,'Emet'],[43,'Gediz'],[43,'Hisarcık'],[43,'Merkez'],[43,'Pazarlar'],
  [43,'Şaphane'],[43,'Simav'],[43,'Tavşanlı'],
  // 44 Malatya
  [44,'Akçadağ'],[44,'Arapgir'],[44,'Arguvan'],[44,'Battalgazi'],[44,'Darende'],
  [44,'Doğanşehir'],[44,'Doğanyol'],[44,'Hekimhan'],[44,'Kale'],[44,'Kuluncak'],
  [44,'Pütürge'],[44,'Yazıhan'],[44,'Yeşilyurt'],
  // 45 Manisa
  [45,'Ahmetli'],[45,'Akhisar'],[45,'Alaşehir'],[45,'Demirci'],[45,'Gölmarmara'],
  [45,'Gördes'],[45,'Kırkağaç'],[45,'Köprübaşı'],[45,'Kula'],[45,'Salihli'],
  [45,'Sarıgöl'],[45,'Saruhanlı'],[45,'Selendi'],[45,'Soma'],[45,'Şehzadeler'],
  [45,'Turgutlu'],[45,'Yunusemre'],
  // 46 Kahramanmaraş
  [46,'Afşin'],[46,'Andırın'],[46,'Çağlayancerit'],[46,'Dulkadiroğlu'],[46,'Ekinözü'],
  [46,'Elbistan'],[46,'Göksun'],[46,'Nurhak'],[46,'Onikişubat'],[46,'Pazarcık'],[46,'Türkoğlu'],
  // 47 Mardin
  [47,'Artuklu'],[47,'Dargeçit'],[47,'Derik'],[47,'Kızıltepe'],[47,'Mazıdağı'],
  [47,'Midyat'],[47,'Nusaybin'],[47,'Ömerli'],[47,'Savur'],[47,'Yeşilli'],
  // 48 Muğla
  [48,'Bodrum'],[48,'Dalaman'],[48,'Datça'],[48,'Fethiye'],[48,'Kavaklıdere'],
  [48,'Köyceğiz'],[48,'Marmaris'],[48,'Menteşe'],[48,'Milas'],[48,'Ortaca'],
  [48,'Seydikemer'],[48,'Ula'],[48,'Yatağan'],
  // 49 Muş
  [49,'Bulanık'],[49,'Hasköy'],[49,'Korkut'],[49,'Malazgirt'],[49,'Merkez'],[49,'Varto'],
  // 50 Nevşehir
  [50,'Acıgöl'],[50,'Avanos'],[50,'Derinkuyu'],[50,'Gülşehir'],[50,'Hacıbektaş'],
  [50,'Kozaklı'],[50,'Merkez'],[50,'Ürgüp'],
  // 51 Niğde
  [51,'Altunhisar'],[51,'Bor'],[51,'Çamardı'],[51,'Çiftlik'],[51,'Merkez'],[51,'Ulukışla'],
  // 52 Ordu
  [52,'Akkuş'],[52,'Altınordu'],[52,'Aybastı'],[52,'Çamaş'],[52,'Çatalpınar'],
  [52,'Çaybaşı'],[52,'Fatsa'],[52,'Gölköy'],[52,'Gülyalı'],[52,'Gürgentepe'],
  [52,'İkizce'],[52,'Kabadüz'],[52,'Kabataş'],[52,'Korgan'],[52,'Kumru'],
  [52,'Mesudiye'],[52,'Perşembe'],[52,'Ulubey'],[52,'Ünye'],
  // 53 Rize
  [53,'Ardeşen'],[53,'Çamlıhemşin'],[53,'Çayeli'],[53,'Derepazarı'],[53,'Fındıklı'],
  [53,'Güneysu'],[53,'Hemşin'],[53,'İkizdere'],[53,'İyidere'],[53,'Kalkandere'],
  [53,'Merkez'],[53,'Pazar'],
  // 54 Sakarya
  [54,'Adapazarı'],[54,'Akyazı'],[54,'Arifiye'],[54,'Erenler'],[54,'Ferizli'],
  [54,'Geyve'],[54,'Hendek'],[54,'Karapürçek'],[54,'Karasu'],[54,'Kaynarca'],
  [54,'Kocaali'],[54,'Pamukova'],[54,'Sapanca'],[54,'Serdivan'],[54,'Söğütlü'],[54,'Taraklı'],
  // 55 Samsun
  [55,'Alaçam'],[55,'Asarcık'],[55,'Atakum'],[55,'Ayvacık'],[55,'Bafra'],[55,'Canik'],
  [55,'Çarşamba'],[55,'İlkadım'],[55,'Kavak'],[55,'Ladik'],[55,'Ondokuzmayıs'],
  [55,'Salıpazarı'],[55,'Tekkeköy'],[55,'Terme'],[55,'Vezirköprü'],[55,'Yakakent'],
  // 56 Siirt
  [56,'Baykan'],[56,'Eruh'],[56,'Kurtalan'],[56,'Merkez'],[56,'Pervari'],
  [56,'Şirvan'],[56,'Tillo'],
  // 57 Sinop
  [57,'Ayancık'],[57,'Boyabat'],[57,'Dikmen'],[57,'Durağan'],[57,'Erfelek'],
  [57,'Gerze'],[57,'Merkez'],[57,'Saraydüzü'],[57,'Türkeli'],
  // 58 Sivas
  [58,'Akıncılar'],[58,'Altınyayla'],[58,'Divriği'],[58,'Doğanşar'],[58,'Gemerek'],
  [58,'Gölova'],[58,'Gürün'],[58,'Hafik'],[58,'İmranlı'],[58,'Kangal'],
  [58,'Koyulhisar'],[58,'Merkez'],[58,'Suşehri'],[58,'Şarkışla'],[58,'Ulaş'],
  [58,'Yıldızeli'],[58,'Zara'],
  // 59 Tekirdağ
  [59,'Çerkezköy'],[59,'Çorlu'],[59,'Ergene'],[59,'Hayrabolu'],[59,'Kapaklı'],
  [59,'Malkara'],[59,'Marmara Ereğlisi'],[59,'Muratlı'],[59,'Saray'],
  [59,'Süleymanpaşa'],[59,'Şarköy'],
  // 60 Tokat
  [60,'Almus'],[60,'Artova'],[60,'Başçiftlik'],[60,'Erbaa'],[60,'Merkez'],
  [60,'Niksar'],[60,'Pazar'],[60,'Reşadiye'],[60,'Sulusaray'],[60,'Turhal'],
  [60,'Yeşilyurt'],[60,'Zile'],
  // 61 Trabzon
  [61,'Akçaabat'],[61,'Araklı'],[61,'Arsin'],[61,'Beşikdüzü'],[61,'Çarşıbaşı'],
  [61,'Çaykara'],[61,'Dernekpazarı'],[61,'Düzköy'],[61,'Hayrat'],[61,'Köprübaşı'],
  [61,'Maçka'],[61,'Of'],[61,'Ortahisar'],[61,'Sürmene'],[61,'Şalpazarı'],
  [61,'Tonya'],[61,'Vakfıkebir'],[61,'Yomra'],
  // 62 Tunceli
  [62,'Çemişgezek'],[62,'Hozat'],[62,'Mazgirt'],[62,'Merkez'],[62,'Nazımiye'],
  [62,'Ovacık'],[62,'Pertek'],[62,'Pülümür'],
  // 63 Şanlıurfa
  [63,'Akçakale'],[63,'Birecik'],[63,'Bozova'],[63,'Ceylanpınar'],[63,'Eyyübiye'],
  [63,'Halfeti'],[63,'Haliliye'],[63,'Harran'],[63,'Hilvan'],[63,'Karaköprü'],
  [63,'Siverek'],[63,'Suruç'],[63,'Viranşehir'],
  // 64 Uşak
  [64,'Banaz'],[64,'Eşme'],[64,'Karahallı'],[64,'Merkez'],[64,'Sivaslı'],[64,'Ulubey'],
  // 65 Van
  [65,'Bahçesaray'],[65,'Başkale'],[65,'Çaldıran'],[65,'Çatak'],[65,'Edremit'],
  [65,'Erciş'],[65,'Gevaş'],[65,'Gürpınar'],[65,'İpekyolu'],[65,'Muradiye'],
  [65,'Özalp'],[65,'Saray'],[65,'Tuşba'],
  // 66 Yozgat
  [66,'Akdağmadeni'],[66,'Aydıncık'],[66,'Boğazlıyan'],[66,'Çandır'],[66,'Çayıralan'],
  [66,'Çekerek'],[66,'Kadışehri'],[66,'Merkez'],[66,'Saraykent'],[66,'Sarıkaya'],
  [66,'Şefaatli'],[66,'Sorgun'],[66,'Yenifakılı'],[66,'Yerköy'],
  // 67 Zonguldak
  [67,'Alaplı'],[67,'Çaycuma'],[67,'Devrek'],[67,'Ereğli'],[67,'Gökçebey'],
  [67,'Kilimli'],[67,'Kozlu'],[67,'Merkez'],
  // 68 Aksaray
  [68,'Ağaçören'],[68,'Eskil'],[68,'Gülağaç'],[68,'Güzelyurt'],[68,'Merkez'],
  [68,'Ortaköy'],[68,'Sarıyahşi'],[68,'Sultanhanı'],
  // 69 Bayburt
  [69,'Aydıntepe'],[69,'Demirözü'],[69,'Merkez'],
  // 70 Karaman
  [70,'Ayrancı'],[70,'Başyayla'],[70,'Ermenek'],[70,'Kazımkarabekir'],[70,'Merkez'],[70,'Sarıveliler'],
  // 71 Kırıkkale
  [71,'Bahşılı'],[71,'Balışeyh'],[71,'Çelebi'],[71,'Delice'],[71,'Karakeçili'],
  [71,'Keskin'],[71,'Merkez'],[71,'Sulakyurt'],[71,'Yahşihan'],
  // 72 Batman
  [72,'Beşiri'],[72,'Gercüş'],[72,'Hasankeyf'],[72,'Kozluk'],[72,'Merkez'],[72,'Sason'],
  // 73 Şırnak
  [73,'Beytüşşebap'],[73,'Cizre'],[73,'Güçlükonak'],[73,'İdil'],[73,'Merkez'],
  [73,'Silopi'],[73,'Uludere'],
  // 74 Bartın
  [74,'Amasra'],[74,'Kurucaşile'],[74,'Merkez'],[74,'Ulus'],
  // 75 Ardahan
  [75,'Çıldır'],[75,'Damal'],[75,'Göle'],[75,'Hanak'],[75,'Merkez'],[75,'Posof'],
  // 76 Iğdır
  [76,'Aralık'],[76,'Karakoyunlu'],[76,'Merkez'],[76,'Tuzluca'],
  // 77 Yalova
  [77,'Altınova'],[77,'Armutlu'],[77,'Çınarcık'],[77,'Çiftlikköy'],[77,'Merkez'],[77,'Termal'],
  // 78 Karabük
  [78,'Eflani'],[78,'Eskipazar'],[78,'Merkez'],[78,'Ovacık'],[78,'Safranbolu'],[78,'Yenice'],
  // 79 Kilis
  [79,'Elbeyli'],[79,'Merkez'],[79,'Musabeyli'],[79,'Polateli'],
  // 80 Osmaniye
  [80,'Bahçe'],[80,'Düziçi'],[80,'Hasanbeyli'],[80,'Kadirli'],[80,'Merkez'],
  [80,'Sumbas'],[80,'Toprakkale'],
  // 81 Düzce
  [81,'Akçakoca'],[81,'Cumayeri'],[81,'Çilimli'],[81,'Gölyaka'],[81,'Gümüşova'],
  [81,'Kaynaşlı'],[81,'Merkez'],[81,'Yığılca'],
]

// 81 Turkish provinces
const CITIES = [
  [1,'Adana'],[2,'Adıyaman'],[3,'Afyonkarahisar'],[4,'Ağrı'],[5,'Amasya'],
  [6,'Ankara'],[7,'Antalya'],[8,'Artvin'],[9,'Aydın'],[10,'Balıkesir'],
  [11,'Bilecik'],[12,'Bingöl'],[13,'Bitlis'],[14,'Bolu'],[15,'Burdur'],
  [16,'Bursa'],[17,'Çanakkale'],[18,'Çankırı'],[19,'Çorum'],[20,'Denizli'],
  [21,'Diyarbakır'],[22,'Edirne'],[23,'Elazığ'],[24,'Erzincan'],[25,'Erzurum'],
  [26,'Eskişehir'],[27,'Gaziantep'],[28,'Giresun'],[29,'Gümüşhane'],[30,'Hakkari'],
  [31,'Hatay'],[32,'Isparta'],[33,'Mersin'],[34,'İstanbul'],[35,'İzmir'],
  [36,'Kars'],[37,'Kastamonu'],[38,'Kayseri'],[39,'Kırklareli'],[40,'Kırşehir'],
  [41,'Kocaeli'],[42,'Konya'],[43,'Kütahya'],[44,'Malatya'],[45,'Manisa'],
  [46,'Kahramanmaraş'],[47,'Mardin'],[48,'Muğla'],[49,'Muş'],[50,'Nevşehir'],
  [51,'Niğde'],[52,'Ordu'],[53,'Rize'],[54,'Sakarya'],[55,'Samsun'],
  [56,'Siirt'],[57,'Sinop'],[58,'Sivas'],[59,'Tekirdağ'],[60,'Tokat'],
  [61,'Trabzon'],[62,'Tunceli'],[63,'Şanlıurfa'],[64,'Uşak'],[65,'Van'],
  [66,'Yozgat'],[67,'Zonguldak'],[68,'Aksaray'],[69,'Bayburt'],[70,'Karaman'],
  [71,'Kırıkkale'],[72,'Batman'],[73,'Şırnak'],[74,'Bartın'],[75,'Ardahan'],
  [76,'Iğdır'],[77,'Yalova'],[78,'Karabük'],[79,'Kilis'],[80,'Osmaniye'],
  [81,'Düzce'],
]

function seedMasterData(db) {
  const insBrand = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_brands (id,name,country,sort_order) VALUES (?,?,?,?)'
  )
  const insModel = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_models (brand_id,name) VALUES (?,?)'
  )
  const insVersion = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_versions (name) VALUES (?)'
  )
  const insFuel = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_fuels (name,sort_order) VALUES (?,?)'
  )
  const insTrans = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_transmissions (name,sort_order) VALUES (?,?)'
  )
  const insBody = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_body_types (name,sort_order) VALUES (?,?)'
  )
  const insDrive = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_drive_types (name,sort_order) VALUES (?,?)'
  )
  const insColor = db.prepare(
    'INSERT OR IGNORE INTO master_vehicle_colors (name,hex_code,sort_order) VALUES (?,?,?)'
  )
  const insCurrency = db.prepare(
    'INSERT OR IGNORE INTO master_currencies (code,name,symbol,sort_order) VALUES (?,?,?,?)'
  )
  const insCity = db.prepare(
    'INSERT OR IGNORE INTO master_cities (plate_code,name,country) VALUES (?,?,?)'
  )
  const insDistrict = db.prepare(
    'INSERT OR IGNORE INTO master_districts (city_code,name) VALUES (?,?)'
  )

  db.transaction(() => {
    for (const [id, name, country] of BRANDS) {
      insBrand.run(id, name, country, id)
    }
    for (const [brand_id, name] of MODELS) {
      insModel.run(brand_id, name)
    }
    for (const v of VERSIONS) {
      insVersion.run(v)
    }
    for (const f of FUELS) {
      insFuel.run(f.name, f.sort_order)
    }
    for (const t of TRANSMISSIONS) {
      insTrans.run(t.name, t.sort_order)
    }
    for (const b of BODY_TYPES) {
      insBody.run(b.name, b.sort_order)
    }
    for (const d of DRIVE_TYPES) {
      insDrive.run(d.name, d.sort_order)
    }
    for (const c of COLORS) {
      insColor.run(c.name, c.hex_code, c.sort_order)
    }
    for (const c of CURRENCIES) {
      insCurrency.run(c.code, c.name, c.symbol, c.sort_order)
    }
    for (const [code, name] of CITIES) {
      insCity.run(code, name, 'TR')
    }
    for (const [city_code, name] of DISTRICTS) {
      insDistrict.run(city_code, name)
    }
  })()

  console.log('[DB] Master data seeded')
}

module.exports = { seedMasterData }
