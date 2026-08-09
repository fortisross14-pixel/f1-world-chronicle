export const SCHEMA_VERSION = 12;

export const RARITY = {
  Generational: { min: 95, max: 99, color: '#e10600', legacy: 1.28 },
  Legend: { min: 90, max: 94, color: '#f4c542', legacy: 1.16 },
  Epic: { min: 85, max: 89, color: '#a86bff', legacy: 1.08 },
  Rare: { min: 80, max: 84, color: '#4da8ff', legacy: 1.02 },
  Uncommon: { min: 72, max: 79, color: '#55c978', legacy: 0.98 },
  Common: { min: 64, max: 71, color: '#f4f4f6', legacy: 0.94 },
};

export const SERIES_META = {
  F1: { name: 'Formula 1', short: 'F1', level: 100, color: '#e10600', detail: 'Full' },
  F2: { name: 'Formula 2', short: 'F2', level: 82, color: '#2d7dff', detail: 'High' },
  F3: { name: 'Formula 3', short: 'F3', level: 70, color: '#37b36b', detail: 'Medium-high' },
  F4: { name: 'Formula 4 World Series', short: 'F4', level: 58, color: '#18a1a8', detail: 'Medium' },
  FE: { name: 'Formula E', short: 'FE', level: 78, color: '#7f5cff', detail: 'Medium' },
  WEC: { name: 'World Endurance', short: 'WEC', level: 80, color: '#f3aa26', detail: 'Medium' },
};

export function makeRng(seed = 1) {
  let value = Math.abs(Number(seed) || 1) % 2147483647;
  if (value === 0) value = 1;
  return {
    next() {
      value = (value * 48271) % 2147483647;
      return (value - 1) / 2147483646;
    },
    int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; },
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; },
    chance(probability) { return this.next() < probability; },
    shuffle(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this.next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

export const COUNTRIES = [
  { name: 'United Kingdom', code: 'GBR', market: 92, first: ['Callum','Oliver','Jack','Theo','Arthur','Lewis','Noah','Elliot','Mason','George'], last: ['Hayes','Bennett','Price','Holloway','Carter','Shaw','Grant','Whitcombe','Rourke','Mercer'] },
  { name: 'Italy', code: 'ITA', market: 87, first: ['Luca','Enzo','Matteo','Marco','Alessio','Davide','Nico','Paolo','Giulio','Leonardo'], last: ['Moretti','Ricci','Bellini','Vitale','Serra','Riva','Bianchi','Ferraro','Conti','Romano'] },
  { name: 'Spain', code: 'ESP', market: 81, first: ['Mateo','Álvaro','Hugo','Sergio','Iker','Adrián','Nicolás','Daniel','Bruno','Gael'], last: ['Serrano','Ferrer','Navarro','Vega','Cortés','Molina','Ramos','Salvat','Ortega','Campos'] },
  { name: 'France', code: 'FRA', market: 84, first: ['Julien','Théo','Bastien','Étienne','Hugo','Maxime','Camille','Louis','Adrien','Gabriel'], last: ['Moreau','Mercier','Dufour','Laurent','Marchand','Leroux','Dubois','Renard','Giraud','Fontaine'] },
  { name: 'Germany', code: 'DEU', market: 88, first: ['Tobias','Jonas','Felix','Konrad','Lukas','Emil','Nico','Leon','Max','Moritz'], last: ['Klein','Weiss','Richter','Hartmann','Vogt','Falk','Schneider','Keller','Bauer','Krüger'] },
  { name: 'Netherlands', code: 'NLD', market: 77, first: ['Daan','Sem','Bram','Jesse','Milan','Thijs','Noud','Finn','Luuk','Sven'], last: ['De Vries','Van Dijk','Smit','Bakker','Visser','Mulder','Bos','Meijer','Vos','Dekker'] },
  { name: 'Belgium', code: 'BEL', market: 67, first: ['Arthur','Milan','Jules','Louis','Mathis','Victor','Noah','Liam'], last: ['Delacroix','Lambert','Peeters','Maes','Willems','Jacobs','Claes','Vermeulen'] },
  { name: 'Portugal', code: 'PRT', market: 62, first: ['Rafael','Tiago','Gonçalo','Diogo','Tomás','Miguel','Afonso','Duarte'], last: ['Costa','Silva','Rocha','Sousa','Pereira','Mendes','Ferreira','Lopes'] },
  { name: 'Brazil', code: 'BRA', market: 91, first: ['Rafael','Gabriel','Felipe','Caio','Lucas','Thiago','Matheus','Bruno','Vinícius','João'], last: ['Azevedo','Costa','Silva','Santos','Oliveira','Pereira','Moura','Ribeiro','Barros','Freitas'] },
  { name: 'Argentina', code: 'ARG', market: 73, first: ['Nicolás','Santiago','Mateo','Franco','Lautaro','Tomás','Agustín','Bautista'], last: ['Ferrer','Paz','Suárez','Rossi','Acosta','Benítez','Méndez','Quiroga'] },
  { name: 'Mexico', code: 'MEX', market: 79, first: ['Diego','Santiago','Emiliano','Mateo','Sebastián','Gael','Rodrigo','Leonardo'], last: ['Valdés','Cruz','Mendoza','Cervantes','Paredes','Salazar','Vargas','Lozano'] },
  { name: 'United States', code: 'USA', market: 97, first: ['Noah','Mason','Cole','Ethan','Logan','Caleb','Aiden','Ryan','Wyatt','Dylan'], last: ['Brooks','Reed','Foster','Mercer','Cole','Carter','Bennett','Walker','Cooper','Hayes'] },
  { name: 'Canada', code: 'CAN', market: 75, first: ['Liam','Owen','Evan','Nathan','Julian','Caleb','Alex','Lucas'], last: ['Tremblay','Martin','Roy','Gagnon','Wilson','MacDonald','Clark','Young'] },
  { name: 'Australia', code: 'AUS', market: 78, first: ['Jack','Lachlan','Oscar','Harrison','Cooper','Flynn','Angus','Riley'], last: ['Rourke','Campbell','Mitchell','Walker','Murphy','Kelly','Ryan','Sullivan'] },
  { name: 'New Zealand', code: 'NZL', market: 52, first: ['Liam','Oliver','Finn','Arlo','Mason','Theo'], last: ['Taylor','Wilson','King','Brown','Scott','Young'] },
  { name: 'Japan', code: 'JPN', market: 89, first: ['Ren','Haruto','Sota','Riku','Kaito','Yuto','Daiki','Minato'], last: ['Ito','Sato','Tanaka','Nakamura','Kobayashi','Yamamoto','Mori','Watanabe'] },
  { name: 'China', code: 'CHN', market: 99, first: ['Wei','Jun','Hao','Tao','Bo','Ming','Yichen','Zihan'], last: ['Zhang','Wang','Li','Chen','Liu','Yang','Huang','Zhao'] },
  { name: 'India', code: 'IND', market: 98, first: ['Arjun','Rohan','Vikram','Kabir','Aarav','Vivaan','Ishaan','Reyansh'], last: ['Mehta','Nair','Kapoor','Sharma','Patel','Reddy','Malhotra','Singh'] },
  { name: 'South Korea', code: 'KOR', market: 86, first: ['Min-jun','Seo-jun','Ji-ho','Hyun-woo','Joon','Tae-hyun'], last: ['Kim','Lee','Park','Choi','Jung','Kang'] },
  { name: 'Sweden', code: 'SWE', market: 63, first: ['Emil','Oscar','Axel','Viggo','Elias','Albin','Noel'], last: ['Nyström','Lindberg','Berg','Sjöberg','Holm','Dahl','Ekström'] },
  { name: 'Norway', code: 'NOR', market: 64, first: ['Mikael','Magnus','Sander','Henrik','Aksel','Marius'], last: ['Strand','Solberg','Haugen','Larsen','Berg','Nilsen'] },
  { name: 'Finland', code: 'FIN', market: 58, first: ['Mikko','Valtteri','Eero','Onni','Aleksi','Jere'], last: ['Laine','Korhonen','Virtanen','Mäkinen','Niemi','Lehtonen'] },
  { name: 'Austria', code: 'AUT', market: 61, first: ['Felix','Lukas','Jonas','Paul','Florian','Maximilian'], last: ['Hartmann','Gruber','Hofer','Leitner','Berger','Fuchs'] },
  { name: 'Switzerland', code: 'CHE', market: 72, first: ['Nico','Luca','Noël','Jan','Levin','Mauro'], last: ['Meier','Müller','Keller','Frei','Schmid','Bucher'] },
  { name: 'Denmark', code: 'DNK', market: 59, first: ['Mads','Emil','Magnus','Oliver','Frederik','Noah'], last: ['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen'] },
  { name: 'South Africa', code: 'ZAF', market: 60, first: ['Liam','Ethan','Luke','Aiden','Joshua','Caleb'], last: ['Mokoena','Botha','Van Wyk','Naidoo','Nkosi','Pretorius'] },
  { name: 'Turkey', code: 'TUR', market: 69, first: ['Emir','Kerem','Arda','Mert','Efe','Can'], last: ['Yılmaz','Kaya','Demir','Aydın','Şahin','Çelik'] },
  { name: 'Poland', code: 'POL', market: 66, first: ['Jakub','Kacper','Jan','Szymon','Mikołaj','Filip'], last: ['Kowalski','Nowak','Wiśniewski','Wójcik','Kamiński','Lewandowski'] },
  { name: 'Hungary', code: 'HUN', market: 55, first: ['Elias','Bence','Máté','Levente','Dávid','Ádám'], last: ['Varga','Nagy','Kovács','Szabó','Tóth','Horváth'] },
  { name: 'Serbia', code: 'SRB', market: 47, first: ['Viktor','Luka','Nikola','Stefan','Miloš','Aleksa'], last: ['Petrović','Jovanović','Nikolić','Marković','Ilić','Stojanović'] },
  { name: 'Lebanon', code: 'LBN', market: 49, first: ['Samir','Karim','Elias','Nadim','Rami','Tarek'], last: ['Haddad','Khoury','Nassar','Saab','Mansour','Farah'] },
  { name: 'Colombia', code: 'COL', market: 65, first: ['Santiago','Nicolás','Juan','Mateo','Samuel','Tomás'], last: ['Cruz','Restrepo','Gómez','Vargas','Rojas','Cardona'] },
];

export const ENGINES = [
  { id: 'ferrari-pu', name: 'Ferrari', country: 'Italy', color: '#e10600', peak: 92, efficiency: 88, reliability: 88, packaging: 90, trajectory: 86 },
  { id: 'mercedes-pu', name: 'Mercedes', country: 'Germany', color: '#00a19c', peak: 91, efficiency: 93, reliability: 92, packaging: 91, trajectory: 89 },
  { id: 'honda-pu', name: 'Honda', country: 'Japan', color: '#f5f5f5', peak: 93, efficiency: 90, reliability: 87, packaging: 89, trajectory: 90 },
  { id: 'audi-pu', name: 'Audi', country: 'Germany', color: '#c9c9c9', peak: 88, efficiency: 89, reliability: 83, packaging: 86, trajectory: 94 },
  { id: 'renault-pu', name: 'Renault', country: 'France', color: '#f7d117', peak: 85, efficiency: 86, reliability: 84, packaging: 87, trajectory: 88 },
  { id: 'gm-pu', name: 'General Motors', country: 'United States', color: '#7f8ca3', peak: 84, efficiency: 85, reliability: 80, packaging: 82, trajectory: 93 },
];

export const MAIN_BRANDS = [
  { id:'ferrari', name:'Ferrari', country:'Italy', type:'Automotive', tier:'Huge', funding:610, prestige:100, protected:true, colors:['#e10600','#ffd100'] },
  { id:'mclaren', name:'McLaren', country:'United Kingdom', type:'Automotive', tier:'Huge', funding:565, prestige:98, protected:true, colors:['#ff8000','#49c6e5'] },
  { id:'mercedes', name:'Mercedes', country:'Germany', type:'Automotive', tier:'Huge', funding:590, prestige:99, protected:true, colors:['#00a19c','#c8c8c8'] },
  { id:'redbull', name:'Red Bull', country:'Austria', type:'Consumer', tier:'Huge', funding:625, prestige:96, protected:false, colors:['#1e41ff','#f5d000'] },
  { id:'aston', name:'Aston Martin', country:'United Kingdom', type:'Automotive', tier:'Big', funding:470, prestige:91, protected:false, colors:['#006f62','#cedc00'] },
  { id:'audi', name:'Audi', country:'Germany', type:'Automotive', tier:'Big', funding:485, prestige:94, protected:false, colors:['#8b8d8f','#ed1c24'] },
  { id:'renault', name:'Renault', country:'France', type:'Automotive', tier:'Big', funding:430, prestige:87, protected:false, colors:['#2293d1','#f384bd'] },
  { id:'williams', name:'Williams', country:'United Kingdom', type:'Racing constructor', tier:'Average', funding:335, prestige:92, protected:true, colors:['#005aff','#ffffff'] },
  { id:'haas', name:'Haas', country:'United States', type:'Industrial', tier:'Average', funding:300, prestige:72, protected:false, colors:['#b6babd','#e6002b'] },
  { id:'cadillac', name:'Cadillac', country:'United States', type:'Automotive', tier:'Big', funding:455, prestige:90, protected:false, colors:['#151515','#d4af37'] },
  { id:'lamborghini', name:'Lamborghini', country:'Italy', type:'Automotive', tier:'Huge', funding:585, prestige:97, protected:false, colors:['#f5d000','#111111'] },
  { id:'bmw', name:'BMW', country:'Germany', type:'Automotive', tier:'Big', funding:500, prestige:96, protected:false, colors:['#0066b1','#ffffff'] },
  { id:'porsche', name:'Porsche', country:'Germany', type:'Automotive', tier:'Huge', funding:575, prestige:98, protected:false, colors:['#111111','#d5001c'] },
  { id:'ford', name:'Ford', country:'United States', type:'Automotive', tier:'Big', funding:470, prestige:93, protected:false, colors:['#003478','#ffffff'] },
  { id:'hyundai', name:'Hyundai', country:'South Korea', type:'Automotive', tier:'Big', funding:445, prestige:88, protected:false, colors:['#002c5f','#00aad2'] },
  { id:'toyota', name:'Toyota', country:'Japan', type:'Automotive', tier:'Huge', funding:565, prestige:97, protected:false, colors:['#eb0a1e','#ffffff'] },
  { id:'honda', name:'Honda', country:'Japan', type:'Automotive', tier:'Big', funding:495, prestige:95, protected:false, colors:['#ffffff','#e40521'] },
  { id:'maserati', name:'Maserati', country:'Italy', type:'Automotive', tier:'Average', funding:355, prestige:89, protected:false, colors:['#0c2340','#ffffff'] },
  { id:'alfa', name:'Alfa Romeo', country:'Italy', type:'Automotive', tier:'Average', funding:340, prestige:90, protected:false, colors:['#8f0c1c','#ffffff'] },
];

export const SPONSOR_BRANDS = [
  { id:'shell', name:'Shell', country:'United Kingdom', industry:'Energy', prestige:94, value:42, targets:['Europe','Americas'], colors:['#ffd500','#ef3024'] },
  { id:'santander', name:'Santander', country:'Spain', industry:'Finance', prestige:88, value:37, targets:['Europe','Americas'], colors:['#ec0000','#ffffff'] },
  { id:'aws', name:'AWS', country:'United States', industry:'Technology', prestige:93, value:45, targets:['Global'], colors:['#ff9900','#232f3e'] },
  { id:'google', name:'Google', country:'United States', industry:'Technology', prestige:97, value:48, targets:['Global'], colors:['#4285f4','#ffffff'] },
  { id:'visa', name:'Visa', country:'United States', industry:'Finance', prestige:95, value:46, targets:['Global'], colors:['#1a1f71','#f7b600'] },
  { id:'oracle', name:'Oracle', country:'United States', industry:'Technology', prestige:92, value:44, targets:['Global'], colors:['#f80000','#ffffff'] },
  { id:'aramco', name:'Aramco', country:'Saudi Arabia', industry:'Energy', prestige:91, value:50, targets:['Middle East','Global'], colors:['#00a3e0','#84bd00'] },
  { id:'petronas', name:'Petronas', country:'Malaysia', industry:'Energy', prestige:90, value:45, targets:['Asia','Global'], colors:['#00a19c','#ffffff'] },
  { id:'hp', name:'HP', country:'United States', industry:'Technology', prestige:89, value:39, targets:['Global'], colors:['#0096d6','#ffffff'] },
  { id:'mastercard', name:'Mastercard', country:'United States', industry:'Finance', prestige:94, value:45, targets:['Global'], colors:['#eb001b','#f79e1b'] },
  { id:'cocacola', name:'Coca-Cola', country:'United States', industry:'Consumer', prestige:98, value:46, targets:['Global'], colors:['#f40009','#ffffff'] },
  { id:'lenovo', name:'Lenovo', country:'China', industry:'Technology', prestige:87, value:38, targets:['China','Global'], colors:['#e2231a','#ffffff'] },
  { id:'tata', name:'Tata', country:'India', industry:'Conglomerate', prestige:86, value:40, targets:['India','Asia'], colors:['#1c8adb','#ffffff'] },
  { id:'byd', name:'BYD', country:'China', industry:'Automotive', prestige:85, value:43, targets:['China','Asia','Europe'], colors:['#e60012','#ffffff'] },
  { id:'rakuten', name:'Rakuten', country:'Japan', industry:'Technology', prestige:84, value:34, targets:['Japan','Asia'], colors:['#bf0000','#ffffff'] },
  { id:'emirates', name:'Emirates', country:'United Arab Emirates', industry:'Airline', prestige:91, value:44, targets:['Middle East','Global'], colors:['#d71920','#ffffff'] },
  { id:'dhl', name:'DHL', country:'Germany', industry:'Logistics', prestige:87, value:35, targets:['Europe','Global'], colors:['#ffcc00','#d40511'] },
  { id:'nike', name:'Nike', country:'United States', industry:'Consumer', prestige:98, value:48, targets:['Global'], colors:['#ffffff','#111111'] },
  { id:'sony', name:'Sony', country:'Japan', industry:'Technology', prestige:93, value:42, targets:['Japan','Global'], colors:['#111111','#ffffff'] },
  { id:'samsung', name:'Samsung', country:'South Korea', industry:'Technology', prestige:96, value:47, targets:['Korea','Asia','Global'], colors:['#1428a0','#ffffff'] },
];

export const F1_TEAM_DEFS = [
  { id:'ferrari', name:'Scuderia Ferrari', short:'FER', country:'Italy', primary:'#e10600', secondary:'#ffd100', engineId:'ferrari-pu', stability:'Heritage institution', heritage:100, budget:97, concept:'Balanced', dna:['heritage','glamour','national icon'], baseline:93, owner:'Ferrari', expectations:'Fight for both championships' },
  { id:'mclaren', name:'McLaren Racing', short:'MCL', country:'United Kingdom', primary:'#ff8000', secondary:'#49c6e5', engineId:'mercedes-pu', stability:'Historic independent', heritage:96, budget:93, concept:'Tyre-friendly', dna:['innovation','youth','racing purity'], baseline:92, owner:'McLaren Group', expectations:'Championship contender' },
  { id:'mercedes', name:'Mercedes-AMG', short:'MER', country:'Germany', primary:'#00a19c', secondary:'#c8c8c8', engineId:'mercedes-pu', stability:'Manufacturer works', heritage:89, budget:96, concept:'Qualifying-focused', dna:['engineering','precision','works'], baseline:91, owner:'Mercedes-Benz', expectations:'Return to title contention' },
  { id:'redbull', name:'Red Bull Racing', short:'RBR', country:'Austria', primary:'#1e41ff', secondary:'#f5d000', engineId:'honda-pu', stability:'Commercial brand', heritage:82, budget:95, concept:'Maximum downforce', dna:['aggression','innovation','academy'], baseline:94, owner:'Red Bull', expectations:'Defend the championship' },
  { id:'aston', name:'Aston Martin', short:'AMR', country:'United Kingdom', primary:'#006f62', secondary:'#cedc00', engineId:'honda-pu', stability:'Manufacturer works', heritage:72, budget:91, concept:'Race-focused', dna:['glamour','works project','ambition'], baseline:87, owner:'Aston Martin', expectations:'Regular podiums' },
  { id:'audi', name:'Audi F1 Team', short:'AUD', country:'Germany', primary:'#8b8d8f', secondary:'#ed1c24', engineId:'audi-pu', stability:'Manufacturer works', heritage:55, budget:90, concept:'Low drag', dna:['works','technology','long project'], baseline:84, owner:'Audi', expectations:'Build toward wins' },
  { id:'alpine', name:'BWT Alpine', short:'ALP', country:'France', primary:'#2293d1', secondary:'#f384bd', engineId:'renault-pu', stability:'Manufacturer works', heritage:70, budget:82, concept:'Balanced', dna:['national','rebuilding','academy'], baseline:81, owner:'Renault Group', expectations:'Lead the midfield' },
  { id:'williams', name:'Williams Racing', short:'WIL', country:'United Kingdom', primary:'#005aff', secondary:'#ffffff', engineId:'mercedes-pu', stability:'Historic independent', heritage:94, budget:78, concept:'Low drag', dna:['heritage','underdog','efficiency'], baseline:80, owner:'Williams Racing', expectations:'Score consistently' },
  { id:'haas', name:'Haas F1 Team', short:'HAS', country:'United States', primary:'#b6babd', secondary:'#e6002b', engineId:'ferrari-pu', stability:'Private entrant', heritage:46, budget:72, concept:'Race-focused', dna:['lean','pragmatic','private'], baseline:77, owner:'Haas Automation', expectations:'Avoid last place' },
  { id:'racing-bulls', name:'Racing Bulls', short:'RB', country:'Italy', primary:'#4e7cba', secondary:'#ffffff', engineId:'honda-pu', stability:'Commercial brand', heritage:52, budget:76, concept:'High downforce', dna:['academy','youth','satellite'], baseline:79, owner:'Red Bull', expectations:'Develop young drivers' },
  { id:'cadillac', name:'Cadillac F1', short:'CAD', country:'United States', primary:'#151515', secondary:'#d4af37', engineId:'gm-pu', stability:'Manufacturer works', heritage:35, budget:84, concept:'Balanced', dna:['American','new entrant','manufacturer'], baseline:76, owner:'General Motors', expectations:'Establish credibility' },
];

export const CIRCUIT_POOL = [
  { id:'melbourne', country:'Australia', city:'Melbourne', name:'Albert Park', class:'Commercial anchor', protected:55, contract:6, traits:{high:76,low:70,straight:75,street:45,overtake:62,tyre:56}, rain:18, temp:23, sprint:false },
  { id:'shanghai', country:'China', city:'Shanghai', name:'Shanghai International', class:'Commercial anchor', protected:62, contract:5, traits:{high:70,low:68,straight:83,street:10,overtake:73,tyre:66}, rain:21, temp:24, sprint:true },
  { id:'suzuka', country:'Japan', city:'Suzuka', name:'Suzuka Circuit', class:'Heritage regular', protected:92, contract:7, traits:{high:96,low:63,straight:66,street:0,overtake:55,tyre:72}, rain:36, temp:21, sprint:false },
  { id:'sakhir', country:'Bahrain', city:'Sakhir', name:'Bahrain International', class:'Commercial anchor', protected:68, contract:9, traits:{high:62,low:79,straight:87,street:0,overtake:82,tyre:88}, rain:4, temp:29, sprint:false },
  { id:'jeddah', country:'Saudi Arabia', city:'Jeddah', name:'Jeddah Corniche', class:'Street project', protected:44, contract:5, traits:{high:92,low:50,straight:92,street:100,overtake:70,tyre:50}, rain:5, temp:30, sprint:false },
  { id:'miami', country:'United States', city:'Miami', name:'Miami International', class:'Street project', protected:47, contract:6, traits:{high:68,low:75,straight:78,street:88,overtake:67,tyre:69}, rain:25, temp:31, sprint:true },
  { id:'monaco', country:'Monaco', city:'Monte Carlo', name:'Circuit de Monaco', class:'Protected classic', protected:100, contract:10, traits:{high:42,low:100,straight:35,street:100,overtake:12,tyre:42}, rain:24, temp:22, sprint:false },
  { id:'barcelona', country:'Spain', city:'Barcelona', name:'Circuit de Barcelona-Catalunya', class:'Heritage regular', protected:70, contract:3, traits:{high:88,low:70,straight:68,street:0,overtake:57,tyre:84}, rain:17, temp:26, sprint:false },
  { id:'montreal', country:'Canada', city:'Montréal', name:'Circuit Gilles Villeneuve', class:'Heritage regular', protected:84, contract:6, traits:{high:55,low:72,straight:93,street:60,overtake:78,tyre:58}, rain:29, temp:23, sprint:false },
  { id:'spielberg', country:'Austria', city:'Spielberg', name:'Red Bull Ring', class:'Heritage regular', protected:78, contract:5, traits:{high:72,low:64,straight:91,street:0,overtake:82,tyre:60}, rain:23, temp:24, sprint:false },
  { id:'silverstone', country:'United Kingdom', city:'Silverstone', name:'Silverstone Circuit', class:'Protected classic', protected:100, contract:10, traits:{high:100,low:54,straight:78,street:0,overtake:72,tyre:79}, rain:38, temp:19, sprint:false },
  { id:'spa', country:'Belgium', city:'Spa-Francorchamps', name:'Circuit de Spa-Francorchamps', class:'Heritage regular', protected:95, contract:5, traits:{high:98,low:55,straight:93,street:0,overtake:79,tyre:74}, rain:52, temp:17, sprint:true },
  { id:'budapest', country:'Hungary', city:'Budapest', name:'Hungaroring', class:'Heritage regular', protected:80, contract:7, traits:{high:66,low:91,straight:44,street:10,overtake:35,tyre:76}, rain:18, temp:31, sprint:false },
  { id:'zandvoort', country:'Netherlands', city:'Zandvoort', name:'Circuit Zandvoort', class:'Heritage regular', protected:72, contract:3, traits:{high:87,low:79,straight:42,street:0,overtake:31,tyre:67}, rain:32, temp:20, sprint:false },
  { id:'monza', country:'Italy', city:'Monza', name:'Autodromo Nazionale Monza', class:'Protected classic', protected:100, contract:10, traits:{high:68,low:44,straight:100,street:0,overtake:74,tyre:51}, rain:14, temp:27, sprint:false },
  { id:'madrid', country:'Spain', city:'Madrid', name:'Madring', class:'Street project', protected:38, contract:10, traits:{high:69,low:78,straight:74,street:78,overtake:61,tyre:62}, rain:19, temp:28, sprint:false },
  { id:'baku', country:'Azerbaijan', city:'Baku', name:'Baku City Circuit', class:'Street project', protected:46, contract:5, traits:{high:48,low:81,straight:100,street:100,overtake:71,tyre:57}, rain:11, temp:25, sprint:false },
  { id:'singapore', country:'Singapore', city:'Singapore', name:'Marina Bay', class:'Commercial anchor', protected:69, contract:7, traits:{high:48,low:94,straight:51,street:100,overtake:37,tyre:88}, rain:47, temp:31, sprint:false },
  { id:'austin', country:'United States', city:'Austin', name:'Circuit of the Americas', class:'Commercial anchor', protected:71, contract:6, traits:{high:90,low:72,straight:78,street:0,overtake:82,tyre:82}, rain:27, temp:27, sprint:true },
  { id:'mexico-city', country:'Mexico', city:'Mexico City', name:'Autódromo Hermanos Rodríguez', class:'Commercial anchor', protected:70, contract:5, traits:{high:65,low:77,straight:96,street:0,overtake:72,tyre:63}, rain:23, temp:22, sprint:false },
  { id:'interlagos', country:'Brazil', city:'São Paulo', name:'Interlagos', class:'Heritage regular', protected:94, contract:8, traits:{high:78,low:74,straight:80,street:0,overtake:87,tyre:76}, rain:45, temp:25, sprint:true },
  { id:'las-vegas', country:'United States', city:'Las Vegas', name:'Las Vegas Strip', class:'Street project', protected:42, contract:6, traits:{high:46,low:67,straight:100,street:100,overtake:75,tyre:48}, rain:6, temp:14, sprint:false },
  { id:'lusail', country:'Qatar', city:'Lusail', name:'Lusail International', class:'Commercial anchor', protected:52, contract:7, traits:{high:96,low:54,straight:80,street:0,overtake:59,tyre:94}, rain:4, temp:28, sprint:true },
  { id:'yas-marina', country:'United Arab Emirates', city:'Abu Dhabi', name:'Yas Marina', class:'Commercial anchor', protected:73, contract:10, traits:{high:61,low:78,straight:88,street:40,overtake:70,tyre:65}, rain:3, temp:27, sprint:false },
  { id:'buenos-aires', country:'Argentina', city:'Buenos Aires', name:'Autódromo Oscar Gálvez', class:'Rotating venue', protected:35, contract:0, traits:{high:63,low:73,straight:72,street:0,overtake:72,tyre:70}, rain:26, temp:25, sprint:false, reserve:true },
  { id:'sepang', country:'Malaysia', city:'Kuala Lumpur', name:'Sepang International', class:'Rotating venue', protected:68, contract:0, traits:{high:88,low:65,straight:89,street:0,overtake:83,tyre:88}, rain:58, temp:32, sprint:false, reserve:true },
  { id:'kyalami', country:'South Africa', city:'Midrand', name:'Kyalami', class:'Rotating venue', protected:61, contract:0, traits:{high:84,low:67,straight:76,street:0,overtake:69,tyre:71}, rain:31, temp:25, sprint:false, reserve:true },
  { id:'istanbul', country:'Turkey', city:'Istanbul', name:'Istanbul Park', class:'Rotating venue', protected:65, contract:0, traits:{high:91,low:63,straight:81,street:0,overtake:83,tyre:90}, rain:29, temp:24, sprint:false, reserve:true },
  { id:'hockenheim', country:'Germany', city:'Hockenheim', name:'Hockenheimring', class:'Rotating venue', protected:72, contract:0, traits:{high:68,low:77,straight:86,street:0,overtake:81,tyre:68}, rain:27, temp:22, sprint:false, reserve:true },
  { id:'portimao', country:'Portugal', city:'Portimão', name:'Algarve International', class:'Rotating venue', protected:58, contract:0, traits:{high:87,low:64,straight:76,street:0,overtake:76,tyre:80}, rain:18, temp:24, sprint:false, reserve:true },
  { id:'seoul', country:'South Korea', city:'Seoul', name:'Seoul Grand Prix Circuit', class:'Street project', protected:28, contract:0, traits:{high:54,low:83,straight:76,street:95,overtake:55,tyre:66}, rain:34, temp:25, sprint:false, reserve:true },
];

const FE_TEAMS = ['Porsche Formula E','Jaguar Electric Racing','Nissan e.dams','Maserati MSG','Mahindra Racing','Andretti Formula E','DS Penske','Envision Racing','Cupra Kiro','Lola Yamaha','Mercedes EQ Revival'];
const WEC_TEAMS = ['Ferrari AF Corse','Toyota Gazoo Racing','Porsche Penske','Cadillac Racing','BMW M Team','Alpine Endurance','Peugeot Sport','Aston Martin Valkyrie'];
const F2_TEAMS = ['ART Grand Prix','Prema Racing','Rodin Motorsport','Campos Racing','Hitech GP','MP Motorsport','DAMS Lucas Oil','Invicta Racing','Trident','Van Amersfoort'];
const F3_TEAMS = ['Prema F3','Trident F3','ART F3','Campos F3','Hitech F3','MP F3','Rodin F3','Van Amersfoort F3','Jenzer F3','AIX Racing'];
const F4_TEAMS = ['Abarth Junior Corse','Lotus Britain F4','Movistar Racing Spain','Renault Academy France','Bosch Junior Motorsport','Volvo Nordic Racing','Toyota Junior Japan','Petrobras Brazil Academy','Mahindra India F4','Ford USA Development','ING Benelux Racing','Emirates Motorsport Academy'];
const F4_TEAM_COUNTRIES = ['Italy','United Kingdom','Spain','France','Germany','Sweden','Japan','Brazil','India','United States','Netherlands','United Arab Emirates'];

const DRIVER_STYLES = ['Aggressive attacker','Precision driver','Tyre whisperer','Wet-weather artist','Late braker','Qualifying specialist','Overtaking specialist','Defensive specialist','Complete driver','Development leader'];
export const TRACK_SPECIALTIES = ['High-speed circuits','Technical circuits','Power circuits','Street circuits','Tyre-limited circuits','Wet weather','Balanced'];
export const PERSONALITY_TRAITS = {
  communication:['Outspoken','Charismatic','Calm','Reserved','Shy'],
  ethics:['Fair','Pragmatic','Ruthless','Dirty'],
  temperament:['Hot-headed','Passionate','Composed','Cold'],
  social:['Loyal','Friendly','Independent','Arrogant','Rivalrous'],
};
function createPersonality(rng){
  return {
    communication:rng.pick(PERSONALITY_TRAITS.communication),
    ethics:rng.pick(PERSONALITY_TRAITS.ethics),
    temperament:rng.pick(PERSONALITY_TRAITS.temperament),
    social:rng.pick(PERSONALITY_TRAITS.social),
  };
}
function initialMind(teamId,happiness=64){
  const teamScore=Math.max(-35,Math.min(55,Math.round((happiness-60)*2.2)));
  return {teamSentiments:teamId?{[teamId]:teamScore}:{},people:{},thoughts:[],press:[],official:{},lastThoughtKey:null};
}
const SERIES_SALARY_SCALE={F1:1,F2:.34,F3:.18,F4:.08,FE:.62,WEC:.68,FREE:.22};
const STAFF_ROLES = ['Team Principal','Sporting Director','Technical Director','Head of Strategy','Race Engineer'];
const STAFF_SPECIALTIES = ['politics','pit operations','aerodynamics','mechanical design','weather strategy','driver coaching','regulation changes','reliability','commercial growth','academy development'];
const STAFF_PERSONALITIES = ['calm builder','demanding perfectionist','political operator','loyal technician','risk-taking innovator','data-first pragmatist'];

function countryByName(name) { return COUNTRIES.find((country) => country.name === name) || COUNTRIES[0]; }
function generateName(rng, countryName) {
  const country = countryByName(countryName);
  return `${rng.pick(country.first)} ${rng.pick(country.last)}`;
}
function rarityTalent(rng, rarity) {
  const band = RARITY[rarity];
  return rng.int(band.min, band.max);
}
function createCareerCurve(rng, debutAge, careerLength, peakAge) {
  const curve = [];
  for (let i = 0; i < careerLength; i += 1) {
    const age = debutAge + i;
    const distance = age - peakAge;
    const developmental = age < peakAge ? 1 - Math.min(0.22, Math.abs(distance) * 0.037) : 1 - Math.min(0.24, distance * 0.022);
    const noise = (rng.next() - 0.5) * 0.025;
    curve.push(Number(Math.max(0.78, Math.min(1.035, developmental + noise)).toFixed(3)));
  }
  return curve;
}
function skillSet(rng, talent, style) {
  // Rarity defines the ceiling, not a flat score in every discipline. Even a
  // Generational driver has identifiable strengths and weaknesses.
  const skills = {
    oneLap: talent + rng.int(-9, 3), racePace: talent + rng.int(-8, 3), racecraft: talent + rng.int(-11, 4),
    tyre: talent + rng.int(-11, 4), wet: talent + rng.int(-13, 5), starts: talent + rng.int(-10, 4),
    consistency: talent + rng.int(-10, 4), feedback: talent + rng.int(-13, 5), composure: talent + rng.int(-11, 5), sympathy: talent + rng.int(-13, 5),
  };
  const boosts = {
    'Aggressive attacker': { oneLap:3, racecraft:9, starts:5, tyre:-6, consistency:-5, composure:-2, sympathy:-3 },
    'Precision driver': { consistency:9, composure:8, racecraft:2, starts:-2 },
    'Tyre whisperer': { tyre:13, racePace:4, consistency:3, oneLap:-3 },
    'Wet-weather artist': { wet:15, composure:5, oneLap:-2 },
    'Late braker': { racecraft:11, oneLap:5, starts:2, tyre:-5, consistency:-5 },
    'Qualifying specialist': { oneLap:15, starts:4, racePace:-8, racecraft:-7, tyre:-6 },
    'Overtaking specialist': { racecraft:13, starts:6, racePace:2, consistency:-4, tyre:-2 },
    'Defensive specialist': { composure:12, racecraft:8, consistency:6, oneLap:-5, starts:-2 },
    'Complete driver': { oneLap:2, racePace:2, racecraft:2, tyre:2, wet:2, starts:2, consistency:2, composure:2 },
    'Development leader': { feedback:15, consistency:5, racePace:2, oneLap:-5, racecraft:-4 },
  }[style] || {};
  Object.entries(boosts).forEach(([key, value]) => { skills[key] += value; });
  Object.keys(skills).forEach((key) => { skills[key] = Math.max(54, Math.min(100, skills[key])); });
  return skills;
}

function createDriver({ rng, id, series, teamId, seat, rarity, age, country, rookie = false, academy = null }) {
  const baseTalent = rarityTalent(rng, rarity);
  const style = rarity === 'Generational' ? rng.pick(['Complete driver','Wet-weather artist','Aggressive attacker','Qualifying specialist','Tyre whisperer','Precision driver','Overtaking specialist','Defensive specialist']) : rng.pick(DRIVER_STYLES);
  const specialtyByStyle = {
    'Wet-weather artist':'Wet weather', 'Tyre whisperer':'Tyre-limited circuits', 'Late braker':'Street circuits',
    'Aggressive attacker':rng.pick(['Street circuits','Power circuits']), 'Precision driver':'Technical circuits',
    'Qualifying specialist':rng.pick(['High-speed circuits','Power circuits']), 'Overtaking specialist':rng.pick(['Street circuits','Power circuits','Technical circuits']),
    'Defensive specialist':rng.pick(['Street circuits','Technical circuits']), 'Development leader':'Balanced',
    'Complete driver':rng.pick(TRACK_SPECIALTIES),
  };
  const trackSpecialty=specialtyByStyle[style]||rng.pick(TRACK_SPECIALTIES);
  const debutAge = series === 'F1' ? rng.int(18,Math.max(18,Math.min(age,24))) : series === 'F2' ? rng.int(17,Math.max(17,Math.min(age,20))) : series === 'F3' ? 16 : series === 'F4' ? 15 : rng.int(18,Math.max(18,Math.min(age,25)));
  // Careers are motorsport careers, not feeder-category careers. Even a short
  // career reaches at least age 30; long careers can extend into the early 40s.
  // This also lets an initial veteran legitimately spawn in his final season.
  const longevityBonus = rarity === 'Generational' ? 3 : rarity === 'Legend' ? 2 : rarity === 'Epic' ? 1 : 0;
  const targetRetirementAge = Math.min(42, age>=35&&rng.chance(.48)?age:Math.max(30, age + 1, 31 + rng.int(0,7) + longevityBonus));
  const careerLength = Math.max(8,targetRetirementAge-debutAge+1);
  const peakAge = rng.int(25,31);
  const curve = createCareerCurve(rng, debutAge, careerLength, peakAge);
  const curveIndex = Math.max(0, Math.min(curve.length - 1, age - debutAge));
  const skills = skillSet(rng, baseTalent, style);
  const salaryScale=SERIES_SALARY_SCALE[series]||.25;
  const salaryBase=(baseTalent ** 2) / 300 + rng.int(0, 8);
  const demandBase=(baseTalent ** 2) / 285 + rng.int(0, 10);
  const driver = {
    id, name: generateName(rng, country), country, countryCode: countryByName(country).code, series, teamId, seat,
    number: rng.int(2, 98), age, debutAge, rarity, baseTalent, style, trackSpecialty, careerLength, peakAge, careerCurve: curve,
    curveIndex, careerMultiplier: curve[curveIndex] || 0.9, annualForm: Number((0.975 + rng.next() * 0.05).toFixed(3)),
    experience: Math.max(15, Math.min(99, 35 + (age - 18) * 5 + rng.int(-8, 8))), confidence: rng.int(46, 74), adaptability: rng.int(62, 94),
    commercial: Math.max(40, Math.min(99, Math.round(countryByName(country).market * 0.5 + baseTalent * 0.35 + rng.int(-8, 8)))),
    fame: Math.max(12, Math.round((baseTalent - 60) * 1.3 + (series === 'F1' ? 20 : 0))), skills,
    contract: { through: 1 + rng.int(1, 3), salary: Math.max(1,Math.round(salaryBase*salaryScale)), status: 'Signed' },
    salaryDemand:Math.max(1,Math.round(demandBase*salaryScale)),
    happiness:{overall:rng.int(54,78),role:rng.int(52,78),results:rng.int(50,76),salary:rng.int(52,78),ambition:rng.int(55,96),reasons:[]},
    personality:createPersonality(rng), mind:null,
    academy, rookie, active: true, role: 'Race driver', engineerId: null, injuryUntilRound:null, promisedSeat:null, seatPromiseThrough:null,
    teamJoinedYear:1, preUniverseTeamYears:Math.min(Math.max(0,age-debutAge),rng.int(0,6)), yearsInSeries:Math.max(0,age-debutAge),
    observedRating:Math.round(baseTalent*(curve[curveIndex]||.9)*(0.975+rng.next()*.05)),
    season: { points:0,wins:0,poles:0,podiums:0,starts:0,dnfs:0,bestFinish:null,qualifyingPoints:0,positionsGained:0,wetScore:0,form:[] },
    career: { f1Starts:0,f1Wins:0,f1Poles:0,f1Podiums:0,f1Points:0,titles:0,seriesTitles:0,leMansWins:0,feTitles:0,wecTitles:0,bestFinish:null,seasons:[] },
    trophies: [], history: [], transferHistory:[],
  };
  driver.mind=initialMind(teamId,driver.happiness.overall);
  return driver;
}

export function effectiveDriverSkill(driver,key){
  const raw=driver?.skills?.[key]??driver?.baseTalent??65;
  const curve=driver?.careerCurve?.[driver?.curveIndex]??driver?.careerMultiplier??.9;
  const form=driver?.annualForm??1;
  const confidence=((driver?.confidence??60)-60)*.07;
  return Math.max(45,Math.min(100,Math.round(raw*curve*form+confidence)));
}
export function currentDriverRating(driver){
  const keys=Object.keys(driver?.skills||{});
  if(!keys.length)return Math.round((driver?.baseTalent||65)*(driver?.careerMultiplier||.9));
  return Math.round(keys.reduce((sum,key)=>sum+effectiveDriverSkill(driver,key),0)/keys.length);
}
export function driverHierarchyScore(driver,year=1){
  const tenure=Math.max(0,year-(driver?.teamJoinedYear??year))+(driver?.preUniverseTeamYears||0);
  const experienceYears=Math.max(0,(driver?.age||18)-(driver?.debutAge||18));
  const career=driver?.career||{};
  // Teams cannot see rarity or future potential. They choose hierarchy from current
  // performance, institutional trust, experience and an established winning record.
  const success=(career.titles||0)*12+(career.f1Wins||0)*.34+(career.f1Podiums||0)*.09+(career.seriesTitles||0)*3;
  const recent=(driver?.season?.points||0)*.015+(driver?.season?.wins||0)*.8;
  const leadershipPromise=driver?.promisedSeat===1&&year<=(driver?.seatPromiseThrough||0)?16:0;
  const rookiePenalty=driver?.series==='F1'&&((driver?.yearsInSeries||0)<=1||driver?.rookie)?8:0;
  const youthPenalty=driver?.series==='F1'&&(driver?.age||30)<23?3:0;
  return currentDriverRating(driver)+Math.min(tenure,8)*.9+Math.min(experienceYears,15)*.65+success+recent+leadershipPromise-rookiePenalty-youthPenalty;
}
export function assignRosterHierarchy(drivers,teamId,year=1){
  const roster=drivers.filter((driver)=>driver.active!==false&&driver.teamId===teamId&&driver.role==='Race driver');
  roster.sort((a,b)=>driverHierarchyScore(b,year)-driverHierarchyScore(a,year)||currentDriverRating(b)-currentDriverRating(a));
  // At universe launch, a 21-year-old F1 arrival is still treated as an apprentice
  // if the team also has an older race driver. The prospect can earn Driver 1 later.
  if(year===1&&roster[0]?.series==='F1'&&roster[0]?.age===21){const veteranIndex=roster.findIndex((driver,index)=>index>0&&(driver.age||0)>21);if(veteranIndex>0)[roster[0],roster[veteranIndex]]=[roster[veteranIndex],roster[0]];}
  roster.forEach((driver,index)=>{driver.seat=index+1;});
  return roster;
}
function syncRaceEngineersForTeam(staff,drivers,team,year=1){
  const roster=assignRosterHierarchy(drivers,team.id,year);
  const engineers=staff.filter((member)=>member.teamId===team.id&&member.role==='Race Engineer').sort((a,b)=>b.rating-a.rating);
  roster.forEach((driver,index)=>{const engineer=engineers[index];driver.engineerId=engineer?.id||null;if(engineer){engineer.assignedDriverId=driver.id;engineer.assignedSeat=driver.seat;}});
  engineers.slice(roster.length).forEach((engineer)=>{engineer.assignedDriverId=null;engineer.assignedSeat=null;});
}

function createStaff(rng, team, role, index = 0) {
  const country = rng.chance(0.58) ? team.country : rng.pick(COUNTRIES).name;
  const rarityRoll = rng.next();
  const rarity = rarityRoll > 0.992 ? 'Generational' : rarityRoll > 0.94 ? 'Legend' : rarityRoll > 0.76 ? 'Epic' : rarityRoll > 0.42 ? 'Rare' : rarityRoll > 0.14 ? 'Uncommon' : 'Common';
  const ratingBand = RARITY[rarity];
  const rating = rng.int(ratingBand.min, ratingBand.max);
  const commercial = Math.max(55, Math.min(99, rating + (role === 'Team Principal' ? rng.int(-1, 8) : rng.int(-10, 3))));
  const technical = Math.max(55, Math.min(99, rating + (role === 'Technical Director' ? rng.int(0, 7) : rng.int(-8, 4))));
  const sporting = Math.max(55, Math.min(99, rating + (role === 'Sporting Director' ? rng.int(0, 7) : rng.int(-8, 4))));
  const strategy = Math.max(55, Math.min(99, rating + (role === 'Head of Strategy' ? rng.int(0, 7) : rng.int(-8, 4))));
  return {
    id:`staff-${team.id}-${role.toLowerCase().replaceAll(' ','-')}-${index}`, name:generateName(rng,country), country, teamId:team.id,
    role, age:rng.int(role === 'Race Engineer' ? 29 : 36, role === 'Race Engineer' ? 55 : 67), rarity,
    rating, commercial, technical, sporting, strategy, specialty:rng.pick(STAFF_SPECIALTIES), personality:rng.pick(STAFF_PERSONALITIES),
    ambition:rng.int(45,98), contractThrough:1+rng.int(2,5), salary:Math.max(1,Math.round((rating**2)/520*({F1:1,F2:.34,F3:.22,F4:.13,FE:.42,WEC:.46}[team.series||'F1']||1))), titles:0,wins:0,valueOverExpected:0,
    assignedDriverId:null,assignedSeat:null,teamJoinedYear:1,preUniverseTeamYears:rng.int(0,Math.min(5,Math.max(0,rng.int(0,8)))),history:[],careerSeasons:[],relationships:{},
  };
}

function requiredStaffRoles(team){
  const series=team.series||'F1';
  const raceEngineerCount=series==='WEC'?3:2;
  const leadership=series==='F1'
    ?['Team Principal','Sporting Director','Technical Director','Head of Strategy']
    :['Team Principal','Technical Director'];
  return [...leadership,...Array(raceEngineerCount).fill('Race Engineer')];
}
function ensureTeamStaff(staff,drivers,team,rng,year=1){
  team.staffIds=team.staffIds||[];
  const required=requiredStaffRoles(team);
  const counts={};
  required.forEach((role)=>{
    const index=counts[role]||0;counts[role]=index+1;
    const current=team.staffIds.map((id)=>staff.find((member)=>member.id===id)).filter(Boolean).filter((member)=>member.role===role)[index];
    if(current)return;
    const member=createStaff(rng,team,role,index);member.contractThrough=year+rng.int(2,5);member.teamJoinedYear=year;member.preUniverseTeamYears=year===1?rng.int(0,5):0;
    staff.push(member);team.staffIds.push(member.id);
  });
  syncRaceEngineersForTeam(staff,drivers,team,year);
}

function createTeam(rng, def, sponsorDeck) {
  const carNoise = () => rng.int(-6, 6);
  const conceptAdjustments={
    'Maximum downforce':{high:6,low:2,straight:-5,tyre:1},
    'High downforce':{high:2,low:6,straight:-5,mechanical:2},
    'Low drag':{high:-2,low:-5,straight:7,energy:3},
    'Tyre-friendly':{high:-2,low:1,straight:-2,tyre:7,mechanical:2},
    'Qualifying-focused':{high:4,straight:3,tyre:-4,reliability:-2,operations:-1},
    'Race-focused':{high:-1,straight:-1,tyre:4,reliability:4,operations:3},
    Balanced:{},
  };
  const conceptAdjustment=conceptAdjustments[def.concept]||{};
  const carValue=(key,min=64)=>Math.max(min,Math.min(98,def.baseline+carNoise()+(conceptAdjustment[key]||0)));
  const brandAlias = { alpine:'renault', 'racing-bulls':'redbull' };
  const mainBrand = MAIN_BRANDS.find((brand)=>brand.id===(brandAlias[def.id]||def.id)) || MAIN_BRANDS.find((brand)=>brand.name===def.owner) || MAIN_BRANDS[0];
  const team = {
    ...def, series:'F1', slotId:`slot-${def.id}`, mainBrandId:mainBrand.id, mainBrandName:mainBrand.name,
    commercialName:def.name, lineage:[{ year:1, name:def.name, owner:def.owner, mainBrandId:mainBrand.id, engineId:def.engineId }],
    car:{ high:carValue('high'), low:carValue('low'), straight:carValue('straight'), tyre:carValue('tyre'), mechanical:carValue('mechanical'), energy:carValue('energy'), reliability:carValue('reliability',68), operations:carValue('operations') },
    facilities:{ aero:Math.max(1,Math.min(10,Math.round((def.baseline-52)/4.8+rng.int(-1,1)))), simulator:Math.max(1,Math.min(10,Math.round((def.baseline-52)/4.8+rng.int(-1,1)))), manufacturing:Math.max(1,Math.min(10,Math.round((def.baseline-52)/4.8+rng.int(-1,1)))), pitCrew:Math.max(1,Math.min(10,Math.round((def.baseline-52)/4.8+rng.int(-1,1)))), academy:Math.max(1,Math.min(10,Math.round((def.baseline-58)/4.8+rng.int(-1,1)))) },
    finances:{
      cash:Math.round(mainBrand.funding*.55+def.budget*rng.int(1,3)),
      annualBudget:mainBrand.funding,
      mainFunding:mainBrand.funding,
      secondarySponsorIncome:0,
      sponsorIncome:0,
      prizeMoney:0,
      driverCost:0,
      staffCost:0,
      engineCost:rng.int(28,58),
      developmentCost:Math.round(def.budget*1.15),
      operatingCost:Math.round(185+def.baseline*1.45), totalIncome:0,totalExpenses:0,
      projectedBalance:0,
      commercialScore:Math.round((mainBrand.prestige+def.heritage)/2),
      dealQuality:0,
      pressure:rng.int(20,65),
      vulnerable:!mainBrand.protected && ['Average','Boutique'].includes(mainBrand.tier) && rng.chance(.42),
    },
    staffIds:[], driverIds:[], reserveIds:[], testDriverIds:[], academyIds:[], sponsorIds:[], liveryHistory:[], upgrades:[],
    season:{ points:0,wins:0,poles:0,podiums:0,dnfs:0,pitScore:0,strategyScore:0,development:0 },
    career:{ entries:0,wins:0,poles:0,podiums:0,points:0,driverTitles:0,constructorTitles:0,seasons:[] },
  };
  const secondary = [sponsorDeck.shift(), sponsorDeck.shift(), sponsorDeck.shift()].filter(Boolean);
  team.sponsorIds = secondary.map((sponsor)=>sponsor.id);
  team.finances.secondarySponsorIncome = secondary.reduce((sum,sponsor)=>sum+sponsor.value,0);
  team.finances.sponsorIncome = team.finances.mainFunding + team.finances.secondarySponsorIncome;
  team.liveryHistory.push({ year:1, primary:def.primary, secondary:def.secondary, titleSponsor:mainBrand.name, note:'Launch identity' });
  return team;
}

function rngSafe(index,min,max){return min+((index*17+13)%(max-min+1));}
function makeSeriesTeams(series) {
  const names = series === 'F2' ? F2_TEAMS : series === 'F3' ? F3_TEAMS : series === 'F4' ? F4_TEAMS : series === 'FE' ? FE_TEAMS : WEC_TEAMS;
  const teams=names.map((name,index)=>({
    id:`${series.toLowerCase()}-team-${index}`, series, name, short:name.split(' ').map((word)=>word[0]).join('').slice(0,3).toUpperCase(),
    country:series==='F4'?(F4_TEAM_COUNTRIES[index]||'Spain'):index%4===0?'United Kingdom':index%4===1?'Italy':index%4===2?'Germany':'Spain', rating: series==='F4'?62+((index*3)%10):series==='F3'?72+((index*3)%9):series==='F2'?78+((index*5)%10):80+((index*4)%11),
    driverIds:[], points:0,wins:0, color:`hsl(${(index*47 + (series.charCodeAt(1)||0)*9)%360} 72% 52%)`,
    carProfile:{high:64+((index*7)%24),low:64+((index*11)%24),straight:64+((index*5)%24),tyre:64+((index*13)%24),reliability:68+((index*9)%22)},
    baseline:series==='F4'?62+((index*3)%10):series==='F3'?72+((index*3)%9):series==='F2'?78+((index*5)%10):80+((index*4)%11),
    facilities:{aero:rngSafe(index,3,7),simulator:rngSafe(index+1,3,8),manufacturing:rngSafe(index+2,3,8),pitCrew:rngSafe(index+3,3,8),academy:rngSafe(index+4,3,9)},
    finances:{cash:series==='F4'?rngSafe(index,18,48):series==='F3'?rngSafe(index,32,70):series==='F2'?rngSafe(index,55,110):rngSafe(index,70,145),income:series==='F4'?rngSafe(index,10,24):series==='F3'?rngSafe(index,18,38):series==='F2'?rngSafe(index,32,65):rngSafe(index,45,90),expenses:series==='F4'?rngSafe(index+2,9,23):series==='F3'?rngSafe(index+2,17,37):series==='F2'?rngSafe(index+2,30,64):rngSafe(index+2,44,88),projectedBalance:0,totalIncome:0,totalExpenses:0},
    season:{points:0,wins:0,poles:0,podiums:0},career:{seasons:[]},staffIds:[],sponsorIds:[],lineage:[{year:1,name,owner:name}],
  }));
  teams.forEach((team)=>{
    team.finances.totalIncome=team.finances.income;
    team.finances.totalExpenses=team.finances.expenses;
    team.finances.projectedBalance=team.finances.income-team.finances.expenses;
    team.finances.mainFunding=team.finances.income;
    team.finances.staffCost=0;
    team.finances.facilityInvestment=0;
  });
  return teams;
}

function distributionFor(series, count, generationalSlots = 0) {
  // Generational talent is controlled globally rather than independently in
  // every championship. The normal grids therefore begin without one and the
  // universe constructor injects only the intended 0-2 global stars.
  const map = {
    F1: [...Array(5).fill('Legend'),...Array(6).fill('Epic'),...Array(6).fill('Rare'),...Array(3).fill('Uncommon'),...Array(2).fill('Common')],
    F2: [...Array(3).fill('Legend'),...Array(5).fill('Epic'),...Array(6).fill('Rare'),...Array(4).fill('Uncommon'),...Array(2).fill('Common')],
    F3: [...Array(2).fill('Legend'),...Array(3).fill('Epic'),...Array(6).fill('Rare'),...Array(6).fill('Uncommon'),...Array(3).fill('Common')],
    F4: [...Array(2).fill('Legend'),...Array(4).fill('Epic'),...Array(7).fill('Rare'),...Array(7).fill('Uncommon'),...Array(4).fill('Common')],
    FE: [...Array(3).fill('Legend'),...Array(5).fill('Epic'),...Array(6).fill('Rare'),...Array(5).fill('Uncommon'),...Array(3).fill('Common')],
    WEC: [...Array(3).fill('Legend'),...Array(6).fill('Epic'),...Array(8).fill('Rare'),...Array(5).fill('Uncommon'),...Array(2).fill('Common')],
  };
  const base=(map[series] || []).slice(0,Math.max(0,count-generationalSlots));
  return [...Array(generationalSlots).fill('Generational'),...base].slice(0,count);
}

function seriesAge(rng, series, rarity) {
  if (series==='F4') return rng.int(15,19);
  if (series==='F3') return rng.int(16,22);
  if (series==='F2') return rng.int(17,25);
  if (series==='F1') { const roll=rng.next(); if(roll>.90)return rng.int(36,40); if(roll>.64)return rng.int(29,35); const minAge=['Generational','Legend'].includes(rarity)?21:rarity==='Epic'?22:23; return rng.int(minAge,28); }
  return rng.int(20,40);
}

function generateDriversForSeries(rng, series, teams, count, countryBias = [], generationalSlots = 0) {
  const rarityList = rng.shuffle(distributionFor(series,count,generationalSlots));
  const drivers = [];
  for (let i=0;i<count;i+=1) {
    const team = teams[Math.floor(i / (count / teams.length)) % teams.length] || teams[i % teams.length];
    const rarity = rarityList[i] || 'Common';
    const country = countryBias[i] || rng.pick(COUNTRIES).name;
    const driver = createDriver({ rng, id:`${series.toLowerCase()}-driver-${i}`, series, teamId:team.id, seat:i%2+1, rarity, age:seriesAge(rng,series,rarity), country, rookie:false, academy:null });
    const years=Math.max(0,driver.age-driver.debutAge);
    if(series==='F1'){
      driver.rookie=years<=1;
      if(driver.age===21){
        driver.curveIndex=Math.max(0,Math.min(driver.careerCurve.length-1,driver.age-driver.debutAge));
        driver.careerCurve[driver.curveIndex]=Number(Math.min(driver.careerCurve[driver.curveIndex]||.86,.82+rng.next()*.06).toFixed(3));
        driver.careerMultiplier=driver.careerCurve[driver.curveIndex];
        driver.observedRating=Math.round(driver.baseTalent*driver.careerMultiplier*driver.annualForm);
      }
      driver.career.f1Starts=Math.max(0,years*rng.int(12,22));
      const eliteFactor=rarity==='Generational'?.42:rarity==='Legend'?.28:rarity==='Epic'?.13:rarity==='Rare'?.055:.015;
      driver.career.f1Wins=Math.max(0,Math.round(years*eliteFactor*rng.next()*2.2));
      driver.career.f1Podiums=Math.max(driver.career.f1Wins,Math.round(driver.career.f1Wins*2.1+years*eliteFactor*2));
      driver.career.f1Poles=Math.max(0,Math.round(driver.career.f1Wins*(.5+rng.next())));
      driver.career.f1Points=Math.round(driver.career.f1Starts*(1.5+eliteFactor*18));
      const titleChance=Math.max(0,years-4)*eliteFactor*.12;
      driver.career.titles=rng.chance(titleChance)?(rng.chance(.2)?2:1):0;
      driver.preUniverseTeamYears=Math.min(years,rng.int(0,Math.min(7,years)));driver.teamJoinedYear=1;
    }
    drivers.push(driver); team.driverIds.push(driver.id);
  }
  return drivers;
}

function buildInitialStories(universe) {
  const f1 = universe.drivers.filter((d)=>d.series==='F1'&&d.role==='Race driver');
  const generational = universe.drivers.filter((d)=>d.active&&d.rarity==='Generational');
  const star = generational[0];
  const bestTeam = [...universe.teams].sort((a,b)=>b.baseline-a.baseline)[0];
  const vulnerable = universe.teams.find((team)=>team.finances.vulnerable) || universe.teams.at(-1);
  const starStory=star?.series==='F1'
    ? { id:'story-launch-2', year:1, round:0, category:'Driver Market', priority:96, headline:`${star.name} carries the era's only Generational ceiling`, dek:`The ${star.age}-year-old begins in Formula 1, but circuit fit, team strength, reliability and specialist weaknesses still determine whether that ceiling becomes championships.`, subjects:[star.id], thread:'title-rivalry' }
    : { id:'story-launch-2', year:1, round:0, category:'Prospect Watch', priority:96, headline:`The universe's rarest prospect begins in ${star?.series||'the ladder'}`, dek:`${star?.name||'A young driver'} starts at age ${star?.age||'—'} in ${star?.series||'the feeder system'}. There is no second Generational driver at launch, so the entire climb can be followed from its beginning.`, subjects:star?[star.id]:[], thread:'famous-rookie' };
  const leadingF1=[...f1].sort((a,b)=>b.observedRating-a.observedRating)[0];
  return [
    { id:'story-launch-1', year:1, round:0, category:'Pre-season', priority:100, headline:`${bestTeam.name} begins the year as the benchmark`, dek:`The paddock model gives the ${bestTeam.short} package the highest launch ceiling, but circuit-specific car traits mean the same constructor will not lead everywhere.`, subjects:[bestTeam.id], thread:'technical-race' },
    starStory,
    { id:'story-launch-3', year:1, round:0, category:'Prospect Watch', priority:88, headline:`${leadingF1?.name||'The leading driver'} starts as the visible benchmark`, dek:`Current ability is only one piece of the title model. One-lap pace, racecraft, tyre use, wet skill and each car's circuit profile can create very different competitive orders.`, subjects:leadingF1?[leadingF1.id]:[], thread:'title-rivalry' },
    { id:'story-launch-4', year:1, round:0, category:'Business', priority:80, headline:`${vulnerable.name} starts under financial scrutiny`, dek:`A weak season or sponsor exit could trigger a sale. Heritage protections do not apply strongly here, making this the grid slot most likely to change identity.`, subjects:[vulnerable.id], thread:'team-survival' },
    { id:'story-launch-5', year:1, round:0, category:'Calendar', priority:72, headline:'Madrid joins a calendar built around protected classics', dek:'Monaco, Monza and Silverstone are effectively locked. Rotating venues remain candidates for a single conservative change at season end.', subjects:['madrid'], thread:'calendar-evolution' },
  ];
}

const SERIES_CALENDAR_IDS={
  F2:['sakhir','jeddah','melbourne','monaco','barcelona','spielberg','silverstone','spa','budapest','monza','baku','lusail','yas-marina','madrid'],
  F3:['sakhir','melbourne','monaco','barcelona','spielberg','silverstone','spa','budapest','monza','madrid','baku','yas-marina'],
  F4:['barcelona','madrid','monaco','spielberg','silverstone','budapest','monza','portimao','istanbul','yas-marina'],
  FE:['mexico-city','jeddah','monaco','berlin','shanghai','madrid','london','seoul','rome','sao-paulo','portland','jakarta'],
  WEC:['lusail','imola','spa','le-mans','interlagos','austin','fuji','sakhir'],
};
const VIRTUAL_CIRCUITS={
  berlin:{id:'berlin',country:'Germany',city:'Berlin',name:'Tempelhof E-Prix',class:'Street project',protected:50,traits:{high:45,low:88,straight:55,street:90,overtake:62,tyre:78},rain:24,temp:22},
  london:{id:'london',country:'United Kingdom',city:'London',name:'London E-Prix',class:'Street project',protected:56,traits:{high:38,low:95,straight:42,street:100,overtake:44,tyre:64},rain:37,temp:20},
  rome:{id:'rome',country:'Italy',city:'Rome',name:'Rome E-Prix',class:'Street project',protected:44,traits:{high:52,low:86,straight:64,street:100,overtake:57,tyre:68},rain:16,temp:27},
  'sao-paulo':{id:'sao-paulo',country:'Brazil',city:'São Paulo',name:'São Paulo E-Prix',class:'Street project',protected:46,traits:{high:60,low:80,straight:78,street:100,overtake:69,tyre:70},rain:42,temp:27},
  portland:{id:'portland',country:'United States',city:'Portland',name:'Portland E-Prix',class:'Commercial anchor',protected:42,traits:{high:74,low:62,straight:84,street:15,overtake:78,tyre:65},rain:28,temp:24},
  jakarta:{id:'jakarta',country:'Indonesia',city:'Jakarta',name:'Jakarta E-Prix',class:'Street project',protected:41,traits:{high:48,low:91,straight:55,street:100,overtake:51,tyre:82},rain:60,temp:33},
  imola:{id:'imola',country:'Italy',city:'Imola',name:'6 Hours of Imola',class:'Heritage regular',protected:84,traits:{high:82,low:74,straight:67,street:0,overtake:43,tyre:76},rain:27,temp:24},
  'le-mans':{id:'le-mans',country:'France',city:'Le Mans',name:'24 Hours of Le Mans',class:'Protected classic',protected:100,traits:{high:87,low:56,straight:100,street:12,overtake:86,tyre:88},rain:34,temp:22},
  fuji:{id:'fuji',country:'Japan',city:'Oyama',name:'6 Hours of Fuji',class:'Heritage regular',protected:79,traits:{high:70,low:73,straight:100,street:0,overtake:82,tyre:72},rain:38,temp:22},
};
function circuitById(id){return CIRCUIT_POOL.find((c)=>c.id===id)||VIRTUAL_CIRCUITS[id]||CIRCUIT_POOL[0];}
function buildCompetitionCalendars(seed,calendar){
  const result={F1:calendar};
  Object.entries(SERIES_CALENDAR_IDS).forEach(([series,ids])=>{result[series]=ids.map((id,index)=>{const c=circuitById(id);return{...c,id:`${series.toLowerCase()}-${id}`,circuitId:c.id,series,round:index+1,week:Math.min(50,2+index*Math.max(2,Math.floor(46/Math.max(1,ids.length-1)))+(series==='FE'?1:0)),status:'Upcoming',sessions:[],weekendSeed:seed+series.charCodeAt(1)*10007+index*1301};});});
  return result;
}

export function createUniverse(seed = 20260731) {
  const rng = makeRng(seed);
  const sponsorDeck = rng.shuffle(SPONSOR_BRANDS);
  const teams = F1_TEAM_DEFS.map((def)=>createTeam(rng,def,sponsorDeck));
  const staff = [];
  teams.forEach((team)=>{
    ['Team Principal','Sporting Director','Technical Director','Head of Strategy'].forEach((role)=>{
      const member=createStaff(rng,team,role); staff.push(member); team.staffIds.push(member.id);
    });
    [0,1].forEach((index)=>{ const member=createStaff(rng,team,'Race Engineer',index); staff.push(member); team.staffIds.push(member.id); });
  });

  const f1CountryBias = ['Hungary','Spain','France','United Kingdom','Japan','Italy','United States','Germany','Belgium','Mexico','Sweden','Brazil','France','Lebanon','United Kingdom','Argentina','United States','Serbia','Italy','India','Colombia','Australia'];
  // New universes normally begin with exactly one Generational driver across
  // the complete ladder. The star can already be in F1 or still several years
  // away in a feeder championship.
  const initialGenerationalSeries = rng.pick(['F1','F1','F1','F2','F3','F4']);
  const f1Drivers = generateDriversForSeries(rng,'F1',teams,22,f1CountryBias,initialGenerationalSeries==='F1'?1:0);
  teams.forEach((team)=>{
    team.driverIds=[...new Set(team.driverIds)].slice(0,2);
    syncRaceEngineersForTeam(staff,f1Drivers,team,1);
  });

  const f2Teams=makeSeriesTeams('F2');
  const f3Teams=makeSeriesTeams('F3');
  const f4Teams=makeSeriesTeams('F4');
  const feTeams=makeSeriesTeams('FE');
  const wecTeams=makeSeriesTeams('WEC');
  const f2Drivers=generateDriversForSeries(rng,'F2',f2Teams,20,[],initialGenerationalSeries==='F2'?1:0);
  const f3Drivers=generateDriversForSeries(rng,'F3',f3Teams,20,[],initialGenerationalSeries==='F3'?1:0);
  const f4Drivers=generateDriversForSeries(rng,'F4',f4Teams,24,[],initialGenerationalSeries==='F4'?1:0);
  const feDrivers=generateDriversForSeries(rng,'FE',feTeams,22);
  const wecDrivers=generateDriversForSeries(rng,'WEC',wecTeams,24);
  const drivers=[...f1Drivers,...f2Drivers,...f3Drivers,...f4Drivers,...feDrivers,...wecDrivers];
  [f2Teams,f3Teams,f4Teams,feTeams,wecTeams].flat().forEach((team)=>ensureTeamStaff(staff,drivers,team,rng,1));

  // Academy links can begin as early as F4, making elite prospects visible for several seasons.
  const feederProspects=[...f2Drivers,...f3Drivers,...f4Drivers].sort((a,b)=>b.observedRating-a.observedRating);
  teams.forEach((team,index)=>{
    const academy=feederProspects.slice(index*3,index*3+3);
    academy.forEach((driver)=>{ driver.academy=team.id; team.academyIds.push(driver.id); });

    // Two test drivers per constructor. They improve simulator correlation and can cover injuries.
    [0,1].forEach((testIndex)=>{
      const rarity=index<2 && testIndex===0?'Epic':index<7?'Rare':'Uncommon';
      const test=createDriver({rng,id:`test-${team.id}-${testIndex}`,series:'F1',teamId:team.id,seat:3,rarity,age:rng.int(21,34),country:rng.pick(COUNTRIES).name,academy:team.id});
      test.role='Test driver';
      test.contract.through=2+rng.int(0,2);
      test.contract.salary=Math.max(2,Math.round(test.contract.salary*.35));
      test.isEmergencyReserve=true;
      drivers.push(test);
      team.testDriverIds.push(test.id);
    });
  });

  // A living market exists outside the grids.
  for(let i=0;i<14;i+=1){
    const roll=rng.next();
    const rarity=roll>.94?'Legend':roll>.76?'Epic':roll>.42?'Rare':roll>.16?'Uncommon':'Common';
    const free=createDriver({rng,id:`free-agent-${i}`,series:'FREE',teamId:null,seat:0,rarity,age:rng.int(20,36),country:rng.pick(COUNTRIES).name});
    free.role='Free agent';
    free.contract={through:1,salary:Math.round(free.baseTalent**2/430),status:'Available'};
    drivers.push(free);
  }

  teams.forEach((team)=>{
    const principal=team.staffIds.map((id)=>staff.find((member)=>member.id===id)).find((member)=>member?.role==='Team Principal');
    const raceDrivers=drivers.filter((driver)=>driver.teamId===team.id&&driver.role==='Race driver');
    const testDrivers=drivers.filter((driver)=>driver.teamId===team.id&&driver.role==='Test driver');
    const nationalityBoost=team.sponsorIds.map((id)=>SPONSOR_BRANDS.find((sponsor)=>sponsor.id===id)).filter(Boolean)
      .reduce((sum,sponsor)=>sum+(raceDrivers.some((driver)=>driver.country===sponsor.country)?sponsor.value*.18:0),0);
    const negotiation=(principal?.commercial||75)/100;
    team.finances.dealQuality=Math.round(negotiation*100);
    team.finances.secondarySponsorIncome=Math.round(team.finances.secondarySponsorIncome*(.78+negotiation*.42)+nationalityBoost);
    team.finances.sponsorIncome=team.finances.mainFunding+team.finances.secondarySponsorIncome;
    team.finances.driverCost=raceDrivers.reduce((sum,driver)=>sum+driver.contract.salary,0)+testDrivers.reduce((sum,driver)=>sum+driver.contract.salary,0);
    team.finances.staffCost=team.staffIds.map((id)=>staff.find((member)=>member.id===id)).filter(Boolean).reduce((sum,member)=>sum+(member.salary||8),0);
    team.finances.totalIncome=team.finances.sponsorIncome;
    team.finances.totalExpenses=team.finances.driverCost+team.finances.staffCost+team.finances.engineCost+team.finances.developmentCost+team.finances.operatingCost;
    team.finances.projectedBalance=team.finances.totalIncome-team.finances.totalExpenses;
    team.testContribution=Math.round(testDrivers.reduce((sum,driver)=>sum+effectiveDriverSkill(driver,'feedback')*.55+effectiveDriverSkill(driver,'consistency')*.25+driver.experience*.2,0)/testDrivers.length);
  });

  const calendar = CIRCUIT_POOL.filter((c)=>!c.reserve).map((c,index)=>({ ...c, circuitId:c.id, series:'F1', round:index+1, week:Math.min(50,2+index*2), status:'Upcoming', sessions:[], weekendSeed:seed + index*1009 }));
  const competitionCalendars=buildCompetitionCalendars(seed,calendar);
  const universe = {
    schemaVersion:SCHEMA_VERSION, seed, createdAt:new Date().toISOString(), name:`Chronicle ${String(seed).slice(-4)}`,
    year:1, seasonIndex:1, series:'F1', currentWeek:1, currentRound:0, currentSession:0, phase:'Pre-season',
    teams, staff, engines:ENGINES, mainBrands:MAIN_BRANDS, sponsors:SPONSOR_BRANDS,
    drivers, feederTeams:{F2:f2Teams,F3:f3Teams,F4:f4Teams,FE:feTeams,WEC:wecTeams},
    calendar, competitionCalendars, circuitPool:[...CIRCUIT_POOL,...Object.values(VIRTUAL_CIRCUITS)], sessionResults:[], raceResults:[],
    feederResults:{F2:[],F3:[],F4:[],FE:[],WEC:[]}, competitionEventResults:{F1:[],F2:[],F3:[],F4:[],FE:[],WEC:[]}, eventArchive:[], marketHistory:[], preseasonReports:[], rivalries:[],
    competitions:[
      {id:'F1',name:'Formula 1 World Championship',level:100},
      {id:'F2',name:'Formula 2 Championship',level:82},
      {id:'F3',name:'Formula 3 Championship',level:70},
      {id:'F4',name:'Formula 4 World Series',level:58},
      {id:'FE',name:'Formula E World Championship',level:78},
      {id:'WEC',name:'World Endurance Championship',level:80},
    ],
    stories:[], threads:[
      {id:'title-rivalry',title:'A new era at the front',status:'Active',heat:82},
      {id:'famous-rookie',title:'The prospect generation',status:'Active',heat:88},
      {id:'technical-race',title:'The development war',status:'Active',heat:73},
      {id:'team-survival',title:'The fight for a grid slot',status:'Active',heat:61},
      {id:'calendar-evolution',title:'The rotating world calendar',status:'Active',heat:46},
      {id:'commercial-arms-race',title:'Sponsors reshape the grid',status:'Active',heat:64},
    ],
    records:{fastestLaps:[],youngestWins:[],classicRaces:[],teamLineage:[],driverMilestones:[]},
    seasonArchive:[], awards:[], pendingDecisions:[], storyCounter:0,
    settings:{calendarChurn:'Conservative',teamDynamism:'Plausible',authenticLock:true,detailLevel:'Full',autoSave:true},
    rules:{fastestLapPoint:false},
    ui:{selectedSeries:'F1'},
  };
  universe.stories=buildInitialStories(universe);
  universe.storyCounter=universe.stories.length;
  return universe;
}

export function getCountryCode(name) { return countryByName(name).code; }
const ISO2_BY_CODE={IDN:'ID',GBR:'GB',ITA:'IT',ESP:'ES',FRA:'FR',DEU:'DE',NLD:'NL',BEL:'BE',PRT:'PT',BRA:'BR',ARG:'AR',MEX:'MX',USA:'US',CAN:'CA',AUS:'AU',NZL:'NZ',JPN:'JP',CHN:'CN',IND:'IN',KOR:'KR',SWE:'SE',NOR:'NO',FIN:'FI',AUT:'AT',CHE:'CH',DNK:'DK',ZAF:'ZA',TUR:'TR',POL:'PL',HUN:'HU',SRB:'RS',LBN:'LB',COL:'CO'};
const ISO2_BY_NAME={'Indonesia':'ID','United Kingdom':'GB','Italy':'IT','Spain':'ES','France':'FR','Germany':'DE','Netherlands':'NL','Belgium':'BE','Portugal':'PT','Brazil':'BR','Argentina':'AR','Mexico':'MX','United States':'US','Canada':'CA','Australia':'AU','New Zealand':'NZ','Japan':'JP','China':'CN','India':'IN','South Korea':'KR','Sweden':'SE','Norway':'NO','Finland':'FI','Austria':'AT','Switzerland':'CH','Denmark':'DK','South Africa':'ZA','Turkey':'TR','Poland':'PL','Hungary':'HU','Serbia':'RS','Lebanon':'LB','Colombia':'CO','Monaco':'MC','Bahrain':'BH','Saudi Arabia':'SA','United Arab Emirates':'AE','Malaysia':'MY','Singapore':'SG','Azerbaijan':'AZ','Qatar':'QA'};
export function countryIso2(codeOrName){
  const raw=String(codeOrName||'');
  return raw.length===2?raw.toUpperCase():raw.length===3?(ISO2_BY_CODE[raw.toUpperCase()]||'UN'):(ISO2_BY_NAME[raw]||ISO2_BY_CODE[countryByName(raw).code]||'UN');
}
export function countryFlag(codeOrName){
  const iso2=countryIso2(codeOrName);
  return [...iso2].map((letter)=>String.fromCodePoint(127397+letter.charCodeAt(0))).join('');
}
function convertLegacyUniverseYears(universe){
  const yearKeys=new Set(['year','retiredYear','teamJoinedYear','contractThrough','seatPromiseThrough','lastMarketYear']);
  const walk=(value,key='')=>{
    if(Array.isArray(value))return value.map((item)=>walk(item,key));
    if(value&&typeof value==='object'){
      Object.keys(value).forEach((child)=>{value[child]=walk(value[child],child);});
      return value;
    }
    if(typeof value==='number'&&value>=2000&&(yearKeys.has(key)||key==='through'||key==='contract'))return Math.max(1,value-2025);
    return value;
  };
  walk(universe);
  universe.year=Math.max(1,universe.year||universe.seasonIndex||1);
  universe.seasonIndex=universe.year;
  return universe;
}
function convertLegacyYearText(text){
  return typeof text==='string'?text.replace(/\b20(?:2[6-9]|[3-9]\d)\b/g,(match)=>`Year ${Number(match)-2025}`):text;
}
function convertLegacyNarrativeYears(universe){
  (universe.stories||[]).forEach((story)=>{story.headline=convertLegacyYearText(story.headline);story.dek=convertLegacyYearText(story.dek);});
  (universe.drivers||[]).forEach((driver)=>{if(Array.isArray(driver.trophies))driver.trophies=driver.trophies.map(convertLegacyYearText);});
}
function defaultLegacyPersonality(driver){
  const seed=[...String(driver.id||driver.name||'driver')].reduce((sum,ch)=>sum+ch.charCodeAt(0),0)+(driver.baseTalent||70)*17;
  return createPersonality(makeRng(seed));
}
export function hydrateUniverse(input){
  const sourceVersion=input?.schemaVersion||0;
  const universe=structuredClone(input);
  if(sourceVersion<12){if(Number(universe.year||0)>=2000)convertLegacyUniverseYears(universe);convertLegacyNarrativeYears(universe);}
  universe.schemaVersion=SCHEMA_VERSION;
  universe.competitionCalendars=universe.competitionCalendars||buildCompetitionCalendars(universe.seed||20260731,universe.calendar||[]);
  universe.competitionEventResults=universe.competitionEventResults||{F1:[],F2:[],F3:[],F4:[],FE:[],WEC:[]};
  universe.eventArchive=universe.eventArchive||[];universe.marketHistory=universe.marketHistory||[];universe.preseasonReports=universe.preseasonReports||[];universe.rivalries=universe.rivalries||[];universe.rules={fastestLapPoint:false,...(universe.rules||{})};
  universe.drivers=(universe.drivers||[]).map((driver)=>{
    const scale=SERIES_SALARY_SCALE[driver.series]||.25;
    const legacyMultiplier=sourceVersion<7&&driver.series!=='F1'&&driver.role!=='Test driver'?scale:1;
    const contract={...(driver.contract||{}),salary:Math.max(1,Math.round((driver.contract?.salary||1)*legacyMultiplier))};
    const demand=sourceVersion<7&&driver.series!=='F1'&&driver.role!=='Test driver'
      ?Math.max(1,Math.round((driver.salaryDemand||((driver.baseTalent||70)**2)/285)*scale))
      :(driver.salaryDemand||Math.max(2,Math.round(((driver.baseTalent||70)**2)/285*scale)));
    const debut=driver.debutAge||18;
    let curve=[...(driver.careerCurve||[])];
    const minimumLength=Math.max(8,30-debut+1,driver.active!==false?Math.max(0,(driver.age||debut)-debut+2):0);
    if(curve.length<minimumLength){
      let last=curve.at(-1)??driver.careerMultiplier??.9;
      while(curve.length<minimumLength){last=Math.max(.78,Number((last-.018).toFixed(3)));curve.push(last);}
    }
    const retired=driver.role==='Retired'||driver.active===false;
    const prematureRetirement=sourceVersion<11&&retired&&(driver.age||99)<30;
    return {...driver,contract,careerCurve:curve,careerLength:Math.max(driver.careerLength||curve.length,curve.length),
      active:prematureRetirement?true:driver.active,role:prematureRetirement?'Free agent':driver.role,series:prematureRetirement?'FREE':driver.series,retiredYear:prematureRetirement?null:driver.retiredYear,retirementReason:prematureRetirement?null:driver.retirementReason,
      seat:prematureRetirement?0:(driver.role==='Test driver'||driver.role==='Reserve driver')?3:(driver.seat||1),
      teamId:prematureRetirement?null:(retired?null:driver.teamId),lastTeamId:driver.lastTeamId||(retired?driver.teamId:null),
      trackSpecialty:driver.trackSpecialty||({'Wet-weather artist':'Wet weather','Tyre whisperer':'Tyre-limited circuits','Late braker':'Street circuits','Precision driver':'Technical circuits','Qualifying specialist':'High-speed circuits','Overtaking specialist':'Technical circuits','Defensive specialist':'Street circuits'}[driver.style]||'Balanced'),
      salaryDemand:demand,
      happiness:driver.happiness||{overall:64,role:64,results:62,salary:62,ambition:75,reasons:[]},
      transferHistory:driver.transferHistory||[],promisedSeat:driver.promisedSeat||null,seatPromiseThrough:driver.seatPromiseThrough||null,
      personality:driver.personality||defaultLegacyPersonality(driver),
      mind:{...initialMind(prematureRetirement?null:driver.teamId,driver.happiness?.overall||64),...(driver.mind||{}),teamSentiments:{...(driver.mind?.teamSentiments||{})},people:{...(driver.mind?.people||{})},thoughts:[...(driver.mind?.thoughts||[])],press:[...(driver.mind?.press||[])],official:{...(driver.mind?.official||{})}},
      preUniverseTeamYears:driver.preUniverseTeamYears||0,
    };
  });
  if(sourceVersion<10){
    const legacyGenerational=universe.drivers.filter((driver)=>driver.active!==false&&driver.rarity==='Generational')
      .sort((a,b)=>(b.career?.titles||0)-(a.career?.titles||0)||(b.career?.f1Wins||0)-(a.career?.f1Wins||0)||(b.baseTalent||0)-(a.baseTalent||0));
    legacyGenerational.slice(2).forEach((driver)=>{
      driver.rarity='Legend';
      driver.baseTalent=Math.min(94,driver.baseTalent||94);
      if(driver.skills)Object.keys(driver.skills).forEach((key)=>{driver.skills[key]=Math.min(97,driver.skills[key]);});
    });
  }
  universe.teams=(universe.teams||[]).map((team)=>{
    const facilities=Object.fromEntries(Object.entries(team.facilities||{}).map(([key,value])=>[key,value>10?Math.max(1,Math.min(10,Number((value/10).toFixed(1)))):value]));
    return {...team,facilities,staffIds:team.staffIds||[],testDriverIds:team.testDriverIds||[],finances:team.finances||{cash:100,totalIncome:0,totalExpenses:0,projectedBalance:0}};
  });
  universe.staff=(universe.staff||[]).map((member)=>({...member,rarity:member.rarity||'Common',assignedDriverId:member.assignedDriverId||null,assignedSeat:member.assignedSeat||null,teamJoinedYear:member.teamJoinedYear||universe.year||1,preUniverseTeamYears:member.preUniverseTeamYears||0,history:member.history||[],careerSeasons:member.careerSeasons||[],relationships:{...(member.relationships||{})}}));
  Object.values(universe.feederTeams||{}).flat().forEach((team)=>{team.carProfile=team.carProfile||{high:team.rating||72,low:team.rating||72,straight:team.rating||72,tyre:team.rating||72,reliability:team.rating||72};team.baseline=team.baseline||team.rating||72;team.facilities=team.facilities||{aero:5,simulator:5,manufacturing:5,pitCrew:5,academy:5};team.finances=team.finances||{cash:60,income:0,expenses:0,projectedBalance:0,totalIncome:0,totalExpenses:0};team.season=team.season||{points:team.points||0,wins:team.wins||0,poles:0,podiums:0};team.staffIds=team.staffIds||[];team.lineage=team.lineage||[{year:universe.year||1,name:team.name,owner:team.name}];});
  universe.currentWeek=universe.currentWeek||1;
  universe.drivers.forEach((driver)=>{driver.teamJoinedYear=driver.teamJoinedYear??(universe.year||1);driver.yearsInSeries=driver.yearsInSeries??Math.max(0,(driver.age||18)-(driver.debutAge||18));});
  const hydrateRng=makeRng((universe.seed||20260731)+(universe.year||1)*97);
  [...universe.teams,...Object.values(universe.feederTeams||{}).flat()].forEach((team)=>ensureTeamStaff(universe.staff,universe.drivers,team,hydrateRng,universe.year||1));
  return universe;
}
export function getTeam(universe,id) { return universe.teams.find((team)=>team.id===id) || Object.values(universe.feederTeams||{}).flat().find((team)=>team.id===id); }
export function getDriver(universe,id) { return universe.drivers.find((driver)=>driver.id===id); }
export function getStaff(universe,id) { return universe.staff.find((member)=>member.id===id); }
export function getEngine(universe,id) { return universe.engines.find((engine)=>engine.id===id); }
export function getSponsor(universe,id) { return universe.sponsors.find((sponsor)=>sponsor.id===id); }
export function getMainBrand(universe,id) { return (universe.mainBrands||MAIN_BRANDS).find((brand)=>brand.id===id); }

export function createProceduralDriver({seed,id,series,teamId,seat=1,rarity='Common',age=17,country=null,rookie=false,academy=null,role='Race driver'}) {
  const rng=makeRng(seed);
  const chosenCountry=country||rng.pick(COUNTRIES).name;
  const driver=createDriver({rng,id,series,teamId,seat,rarity,age,country:chosenCountry,rookie,academy});
  driver.role=role;
  return driver;
}
