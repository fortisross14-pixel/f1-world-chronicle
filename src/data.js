export const SCHEMA_VERSION = 4;

export const RARITY = {
  Generational: { min: 95, max: 99, color: '#ffd34e', legacy: 1.28 },
  Legend: { min: 90, max: 94, color: '#e39aff', legacy: 1.16 },
  Epic: { min: 85, max: 89, color: '#9f88ff', legacy: 1.08 },
  Rare: { min: 80, max: 84, color: '#55b7ff', legacy: 1.02 },
  Uncommon: { min: 72, max: 79, color: '#69d58c', legacy: 0.98 },
  Common: { min: 64, max: 71, color: '#a6a6ae', legacy: 0.94 },
};

export const SERIES_META = {
  F1: { name: 'Formula 1', short: 'F1', level: 100, color: '#e10600', detail: 'Full' },
  F2: { name: 'Formula 2', short: 'F2', level: 82, color: '#2d7dff', detail: 'High' },
  F3: { name: 'Formula 3', short: 'F3', level: 70, color: '#37b36b', detail: 'Medium-high' },
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
  { id:'melbourne', country:'Australia', city:'Melbourne', name:'Albert Park', class:'Commercial anchor', protected:55, contract:2031, traits:{high:76,low:70,straight:75,street:45,overtake:62,tyre:56}, rain:18, temp:23, sprint:false },
  { id:'shanghai', country:'China', city:'Shanghai', name:'Shanghai International', class:'Commercial anchor', protected:62, contract:2030, traits:{high:70,low:68,straight:83,street:10,overtake:73,tyre:66}, rain:21, temp:24, sprint:true },
  { id:'suzuka', country:'Japan', city:'Suzuka', name:'Suzuka Circuit', class:'Heritage regular', protected:92, contract:2032, traits:{high:96,low:63,straight:66,street:0,overtake:55,tyre:72}, rain:36, temp:21, sprint:false },
  { id:'sakhir', country:'Bahrain', city:'Sakhir', name:'Bahrain International', class:'Commercial anchor', protected:68, contract:2034, traits:{high:62,low:79,straight:87,street:0,overtake:82,tyre:88}, rain:4, temp:29, sprint:false },
  { id:'jeddah', country:'Saudi Arabia', city:'Jeddah', name:'Jeddah Corniche', class:'Street project', protected:44, contract:2030, traits:{high:92,low:50,straight:92,street:100,overtake:70,tyre:50}, rain:5, temp:30, sprint:false },
  { id:'miami', country:'United States', city:'Miami', name:'Miami International', class:'Street project', protected:47, contract:2031, traits:{high:68,low:75,straight:78,street:88,overtake:67,tyre:69}, rain:25, temp:31, sprint:true },
  { id:'monaco', country:'Monaco', city:'Monte Carlo', name:'Circuit de Monaco', class:'Protected classic', protected:100, contract:2035, traits:{high:42,low:100,straight:35,street:100,overtake:12,tyre:42}, rain:24, temp:22, sprint:false },
  { id:'barcelona', country:'Spain', city:'Barcelona', name:'Circuit de Barcelona-Catalunya', class:'Heritage regular', protected:70, contract:2028, traits:{high:88,low:70,straight:68,street:0,overtake:57,tyre:84}, rain:17, temp:26, sprint:false },
  { id:'montreal', country:'Canada', city:'Montréal', name:'Circuit Gilles Villeneuve', class:'Heritage regular', protected:84, contract:2031, traits:{high:55,low:72,straight:93,street:60,overtake:78,tyre:58}, rain:29, temp:23, sprint:false },
  { id:'spielberg', country:'Austria', city:'Spielberg', name:'Red Bull Ring', class:'Heritage regular', protected:78, contract:2030, traits:{high:72,low:64,straight:91,street:0,overtake:82,tyre:60}, rain:23, temp:24, sprint:false },
  { id:'silverstone', country:'United Kingdom', city:'Silverstone', name:'Silverstone Circuit', class:'Protected classic', protected:100, contract:2035, traits:{high:100,low:54,straight:78,street:0,overtake:72,tyre:79}, rain:38, temp:19, sprint:false },
  { id:'spa', country:'Belgium', city:'Spa-Francorchamps', name:'Circuit de Spa-Francorchamps', class:'Heritage regular', protected:95, contract:2030, traits:{high:98,low:55,straight:93,street:0,overtake:79,tyre:74}, rain:52, temp:17, sprint:true },
  { id:'budapest', country:'Hungary', city:'Budapest', name:'Hungaroring', class:'Heritage regular', protected:80, contract:2032, traits:{high:66,low:91,straight:44,street:10,overtake:35,tyre:76}, rain:18, temp:31, sprint:false },
  { id:'zandvoort', country:'Netherlands', city:'Zandvoort', name:'Circuit Zandvoort', class:'Heritage regular', protected:72, contract:2028, traits:{high:87,low:79,straight:42,street:0,overtake:31,tyre:67}, rain:32, temp:20, sprint:false },
  { id:'monza', country:'Italy', city:'Monza', name:'Autodromo Nazionale Monza', class:'Protected classic', protected:100, contract:2035, traits:{high:68,low:44,straight:100,street:0,overtake:74,tyre:51}, rain:14, temp:27, sprint:false },
  { id:'madrid', country:'Spain', city:'Madrid', name:'Madring', class:'Street project', protected:38, contract:2035, traits:{high:69,low:78,straight:74,street:78,overtake:61,tyre:62}, rain:19, temp:28, sprint:false },
  { id:'baku', country:'Azerbaijan', city:'Baku', name:'Baku City Circuit', class:'Street project', protected:46, contract:2030, traits:{high:48,low:81,straight:100,street:100,overtake:71,tyre:57}, rain:11, temp:25, sprint:false },
  { id:'singapore', country:'Singapore', city:'Singapore', name:'Marina Bay', class:'Commercial anchor', protected:69, contract:2032, traits:{high:48,low:94,straight:51,street:100,overtake:37,tyre:88}, rain:47, temp:31, sprint:false },
  { id:'austin', country:'United States', city:'Austin', name:'Circuit of the Americas', class:'Commercial anchor', protected:71, contract:2031, traits:{high:90,low:72,straight:78,street:0,overtake:82,tyre:82}, rain:27, temp:27, sprint:true },
  { id:'mexico-city', country:'Mexico', city:'Mexico City', name:'Autódromo Hermanos Rodríguez', class:'Commercial anchor', protected:70, contract:2030, traits:{high:65,low:77,straight:96,street:0,overtake:72,tyre:63}, rain:23, temp:22, sprint:false },
  { id:'interlagos', country:'Brazil', city:'São Paulo', name:'Interlagos', class:'Heritage regular', protected:94, contract:2033, traits:{high:78,low:74,straight:80,street:0,overtake:87,tyre:76}, rain:45, temp:25, sprint:true },
  { id:'las-vegas', country:'United States', city:'Las Vegas', name:'Las Vegas Strip', class:'Street project', protected:42, contract:2031, traits:{high:46,low:67,straight:100,street:100,overtake:75,tyre:48}, rain:6, temp:14, sprint:false },
  { id:'lusail', country:'Qatar', city:'Lusail', name:'Lusail International', class:'Commercial anchor', protected:52, contract:2032, traits:{high:96,low:54,straight:80,street:0,overtake:59,tyre:94}, rain:4, temp:28, sprint:true },
  { id:'yas-marina', country:'United Arab Emirates', city:'Abu Dhabi', name:'Yas Marina', class:'Commercial anchor', protected:73, contract:2035, traits:{high:61,low:78,straight:88,street:40,overtake:70,tyre:65}, rain:3, temp:27, sprint:false },
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

const DRIVER_STYLES = ['Aggressive attacker','Precision driver','Tyre whisperer','Wet-weather artist','Late braker','Qualifying specialist','Complete driver','Development leader'];
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
    const developmental = age < peakAge ? 1 - Math.min(0.18, Math.abs(distance) * 0.027) : 1 - Math.min(0.24, distance * 0.022);
    const noise = (rng.next() - 0.5) * 0.025;
    curve.push(Number(Math.max(0.78, Math.min(1.035, developmental + noise)).toFixed(3)));
  }
  return curve;
}
function skillSet(rng, talent, style) {
  const skills = {
    oneLap: talent + rng.int(-4, 4), racePace: talent + rng.int(-4, 4), racecraft: talent + rng.int(-6, 5),
    tyre: talent + rng.int(-6, 5), wet: talent + rng.int(-8, 6), starts: talent + rng.int(-6, 5),
    consistency: talent + rng.int(-6, 5), feedback: talent + rng.int(-7, 6), composure: talent + rng.int(-6, 6), sympathy: talent + rng.int(-6, 6),
  };
  const boosts = {
    'Aggressive attacker': { oneLap:3, racecraft:6, tyre:-4, consistency:-3, sympathy:-2 },
    'Precision driver': { consistency:7, composure:4, oneLap:1 },
    'Tyre whisperer': { tyre:9, racePace:4, consistency:2 },
    'Wet-weather artist': { wet:11, composure:4 },
    'Late braker': { racecraft:7, oneLap:3, consistency:-3 },
    'Qualifying specialist': { oneLap:10, racePace:-3, tyre:-2 },
    'Complete driver': { oneLap:4, racePace:4, racecraft:4, tyre:4, wet:4, starts:4, consistency:4, composure:4 },
    'Development leader': { feedback:11, racePace:2, consistency:3 },
  }[style] || {};
  Object.entries(boosts).forEach(([key, value]) => { skills[key] += value; });
  Object.keys(skills).forEach((key) => { skills[key] = Math.max(55, Math.min(100, skills[key])); });
  return skills;
}

function createDriver({ rng, id, series, teamId, seat, rarity, age, country, rookie = false, academy = null }) {
  const baseTalent = rarityTalent(rng, rarity);
  const style = rarity === 'Generational' ? rng.pick(['Complete driver','Wet-weather artist','Aggressive attacker']) : rng.pick(DRIVER_STYLES);
  const debutAge = series === 'F1' ? Math.max(18, age - rng.int(0, 5)) : series === 'F2' ? 17 : series === 'F3' ? 16 : Math.max(18, age - rng.int(0, 6));
  const careerLength = series === 'F1' ? rng.int(10, 15) : rng.int(8, 15);
  const peakAge = rng.int(26, 31);
  const curve = createCareerCurve(rng, debutAge, careerLength, peakAge);
  const curveIndex = Math.max(0, Math.min(curve.length - 1, age - debutAge));
  const skills = skillSet(rng, baseTalent, style);
  return {
    id, name: generateName(rng, country), country, countryCode: countryByName(country).code, series, teamId, seat,
    number: rng.int(2, 98), age, debutAge, rarity, baseTalent, style, careerLength, peakAge, careerCurve: curve,
    curveIndex, careerMultiplier: curve[curveIndex] || 0.9, annualForm: Number((0.975 + rng.next() * 0.05).toFixed(3)),
    experience: Math.max(15, Math.min(99, 35 + (age - 18) * 5 + rng.int(-8, 8))), confidence: rng.int(46, 74), adaptability: rng.int(62, 94),
    commercial: Math.max(40, Math.min(99, Math.round(countryByName(country).market * 0.5 + baseTalent * 0.35 + rng.int(-8, 8)))),
    fame: Math.max(12, Math.round((baseTalent - 60) * 1.3 + (series === 'F1' ? 20 : 0))), skills,
    contract: { through: 2026 + rng.int(1, 3), salary: Math.round((baseTalent ** 2) / 300 + rng.int(0, 8)), status: 'Signed' },
    academy, rookie, active: true, role: series === 'F1' ? 'Race driver' : 'Race driver', engineerId: null,
    season: { points:0,wins:0,poles:0,podiums:0,starts:0,dnfs:0,bestFinish:null,qualifyingPoints:0,positionsGained:0,wetScore:0,form:[] },
    career: { f1Starts:0,f1Wins:0,f1Poles:0,f1Podiums:0,f1Points:0,titles:0,seriesTitles:0,leMansWins:0,feTitles:0,wecTitles:0,bestFinish:null,seasons:[] },
    trophies: [], history: [],
  };
}

function createStaff(rng, team, role, index = 0) {
  const country = rng.chance(0.58) ? team.country : rng.pick(COUNTRIES).name;
  const rarityRoll = rng.next();
  const rarity = rarityRoll > 0.94 ? 'Legend' : rarityRoll > 0.76 ? 'Epic' : rarityRoll > 0.42 ? 'Rare' : 'Uncommon';
  const ratingBand = RARITY[rarity];
  return {
    id:`staff-${team.id}-${role.toLowerCase().replaceAll(' ','-')}-${index}`, name:generateName(rng,country), country, teamId:team.id,
    role, age:rng.int(role === 'Race Engineer' ? 29 : 36, role === 'Race Engineer' ? 55 : 67), rarity,
    rating:rng.int(ratingBand.min, ratingBand.max), specialty:rng.pick(STAFF_SPECIALTIES), personality:rng.pick(STAFF_PERSONALITIES),
    ambition:rng.int(45,98), contractThrough:2026+rng.int(2,5), titles:0,wins:0,valueOverExpected:0, history:[],
  };
}

function createTeam(rng, def, sponsorDeck) {
  const carNoise = () => rng.int(-3, 3);
  const team = {
    ...def, commercialName:def.name, lineage:[{ year:2026, name:def.name, owner:def.owner, engineId:def.engineId }],
    car:{ high:Math.max(65,def.baseline+carNoise()), low:Math.max(65,def.baseline+carNoise()), straight:Math.max(65,def.baseline+carNoise()), tyre:Math.max(65,def.baseline+carNoise()), mechanical:Math.max(65,def.baseline+carNoise()), energy:Math.max(65,def.baseline+carNoise()), reliability:Math.max(68,def.baseline+carNoise()), operations:Math.max(65,def.baseline+carNoise()) },
    facilities:{ aero:Math.max(60,def.baseline+rng.int(-5,3)), simulator:Math.max(60,def.baseline+rng.int(-5,3)), manufacturing:Math.max(60,def.baseline+rng.int(-5,3)), pitCrew:Math.max(60,def.baseline+rng.int(-5,3)), academy:Math.max(55,def.baseline+rng.int(-12,2)) },
    finances:{ cash:def.budget*rng.int(3,5), annualBudget:def.budget*5, sponsorIncome:0, engineCost:rng.int(25,55), pressure:rng.int(20,65), vulnerable:def.stability==='Private entrant' && rng.chance(.45) },
    staffIds:[], driverIds:[], reserveIds:[], academyIds:[], sponsorIds:[], liveryHistory:[], upgrades:[],
    season:{ points:0,wins:0,poles:0,podiums:0,dnfs:0,pitScore:0,strategyScore:0,development:0 },
    career:{ entries:0,wins:0,poles:0,podiums:0,points:0,driverTitles:0,constructorTitles:0,seasons:[] },
  };
  const title = sponsorDeck.shift(); const major = sponsorDeck.shift(); const technical = sponsorDeck.shift();
  team.sponsorIds = [title?.id, major?.id, technical?.id].filter(Boolean);
  team.finances.sponsorIncome = [title,major,technical].filter(Boolean).reduce((sum,s)=>sum+s.value,0);
  team.liveryHistory.push({ year:2026, primary:def.primary, secondary:def.secondary, titleSponsor:title?.name || def.owner, note:'Launch identity' });
  return team;
}

function makeSeriesTeams(series) {
  const names = series === 'F2' ? F2_TEAMS : series === 'F3' ? F3_TEAMS : series === 'FE' ? FE_TEAMS : WEC_TEAMS;
  return names.map((name,index)=>({
    id:`${series.toLowerCase()}-team-${index}`, series, name, short:name.split(' ').map((word)=>word[0]).join('').slice(0,3).toUpperCase(),
    country:index%3===0?'United Kingdom':index%3===1?'Italy':'Germany', rating: series==='F3'?72+((index*3)%9):series==='F2'?78+((index*5)%10):80+((index*4)%11),
    driverIds:[], points:0,wins:0, color:`hsl(${(index*47 + (series.charCodeAt(1)||0)*9)%360} 72% 52%)`,
  }));
}

function distributionFor(series, count) {
  const map = {
    F1: ['Generational','Generational',...Array(4).fill('Legend'),...Array(6).fill('Epic'),...Array(6).fill('Rare'),...Array(3).fill('Uncommon'),'Common'],
    F2: ['Generational',...Array(2).fill('Legend'),...Array(5).fill('Epic'),...Array(6).fill('Rare'),...Array(4).fill('Uncommon'),...Array(2).fill('Common')],
    F3: ['Legend',...Array(3).fill('Epic'),...Array(6).fill('Rare'),...Array(7).fill('Uncommon'),...Array(3).fill('Common')],
    FE: [...Array(3).fill('Legend'),...Array(5).fill('Epic'),...Array(6).fill('Rare'),...Array(5).fill('Uncommon'),...Array(3).fill('Common')],
    WEC: [...Array(3).fill('Legend'),...Array(6).fill('Epic'),...Array(8).fill('Rare'),...Array(5).fill('Uncommon'),...Array(2).fill('Common')],
  };
  return (map[series] || []).slice(0,count);
}

function seriesAge(rng, series, rarity) {
  if (series==='F3') return rarity==='Legend' ? rng.int(16,18) : rng.int(16,20);
  if (series==='F2') return rarity==='Generational' ? 18 : rng.int(18,23);
  if (series==='F1') return rarity==='Generational' ? rng.int(21,25) : rng.int(20,34);
  return rng.int(23,37);
}

function generateDriversForSeries(rng, series, teams, count, countryBias = []) {
  const rarityList = rng.shuffle(distributionFor(series,count));
  const drivers = [];
  for (let i=0;i<count;i+=1) {
    const team = teams[Math.floor(i / (count / teams.length)) % teams.length] || teams[i % teams.length];
    const rarity = rarityList[i] || 'Common';
    const country = countryBias[i] || rng.pick(COUNTRIES).name;
    const driver = createDriver({ rng, id:`${series.toLowerCase()}-driver-${i}`, series, teamId:team.id, seat:i%2+1, rarity, age:seriesAge(rng,series,rarity), country, rookie:series==='F1' && i>18, academy:null });
    drivers.push(driver); team.driverIds.push(driver.id);
  }
  return drivers;
}

function buildInitialStories(universe) {
  const f1 = universe.drivers.filter((d)=>d.series==='F1');
  const generational = f1.filter((d)=>d.rarity==='Generational');
  const prospect = universe.drivers.filter((d)=>d.series==='F2' && d.rarity==='Generational')[0];
  const bestTeam = [...universe.teams].sort((a,b)=>b.baseline-a.baseline)[0];
  const vulnerable = universe.teams.find((team)=>team.finances.vulnerable) || universe.teams.at(-1);
  return [
    { id:'story-launch-1', year:2026, round:0, category:'Pre-season', priority:100, headline:`${bestTeam.name} begins the year as the benchmark`, dek:`The paddock model gives the ${bestTeam.short} package the highest launch ceiling, but three teams are close enough to punish a poor development path.`, subjects:[bestTeam.id], thread:'technical-race' },
    { id:'story-launch-2', year:2026, round:0, category:'Driver Market', priority:96, headline:`A two-star generation arrives at the front`, dek:`${generational.map((d)=>d.name).join(' and ')} carry Generational ceilings. Their rivalry can define the era, but machinery and reliability will still decide when greatness becomes silverware.`, subjects:generational.map((d)=>d.id), thread:'title-rivalry' },
    { id:'story-launch-3', year:2026, round:0, category:'Prospect Watch', priority:94, headline:`The 18-year-old everyone is already watching`, dek:`${prospect.name} enters Formula 2 with a Generational rating and a realistic chance to reach F1 before turning 20. Every result will increase the seat pressure above.`, subjects:[prospect.id], thread:'famous-rookie' },
    { id:'story-launch-4', year:2026, round:0, category:'Business', priority:80, headline:`${vulnerable.name} starts under financial scrutiny`, dek:`A weak season or sponsor exit could trigger a sale. Heritage protections do not apply strongly here, making this the grid slot most likely to change identity.`, subjects:[vulnerable.id], thread:'team-survival' },
    { id:'story-launch-5', year:2026, round:0, category:'Calendar', priority:72, headline:'Madrid joins a calendar built around protected classics', dek:'Monaco, Monza and Silverstone are effectively locked. Rotating venues remain candidates for a single conservative change at season end.', subjects:['madrid'], thread:'calendar-evolution' },
  ];
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
  const f1Drivers = generateDriversForSeries(rng,'F1',teams,22,f1CountryBias);
  f1Drivers.forEach((driver,index)=>{
    driver.seat=(index%2)+1;
    const engineers=staff.filter((member)=>member.teamId===driver.teamId && member.role==='Race Engineer');
    driver.engineerId=engineers[index%2]?.id || null;
  });
  teams.forEach((team)=>{ team.driverIds=[...new Set(team.driverIds)].slice(0,2); });

  const f2Teams=makeSeriesTeams('F2'); const f3Teams=makeSeriesTeams('F3'); const feTeams=makeSeriesTeams('FE'); const wecTeams=makeSeriesTeams('WEC');
  const f2Drivers=generateDriversForSeries(rng,'F2',f2Teams,20);
  const f3Drivers=generateDriversForSeries(rng,'F3',f3Teams,20);
  const feDrivers=generateDriversForSeries(rng,'FE',feTeams,22);
  const wecDrivers=generateDriversForSeries(rng,'WEC',wecTeams,24);
  const drivers=[...f1Drivers,...f2Drivers,...f3Drivers,...feDrivers,...wecDrivers];

  // Academy and reserve links.
  const feederProspects=[...f2Drivers,...f3Drivers].sort((a,b)=>b.baseTalent-a.baseTalent);
  teams.forEach((team,index)=>{
    const academy=feederProspects.slice(index*2,index*2+2);
    academy.forEach((driver)=>{ driver.academy=team.id; team.academyIds.push(driver.id); });
    const reserve=createDriver({rng,id:`reserve-${team.id}`,series:'F1',teamId:team.id,seat:0,rarity:index<3?'Epic':'Rare',age:rng.int(22,31),country:rng.pick(COUNTRIES).name,academy:team.id});
    reserve.role='Reserve driver'; reserve.active=true; reserve.contract.through=2027; drivers.push(reserve); team.reserveIds.push(reserve.id);
  });

  const calendar = CIRCUIT_POOL.filter((c)=>!c.reserve).map((c,index)=>({ ...c, round:index+1, status:'Upcoming', sessions:[], weekendSeed:seed + index*1009 }));
  const universe = {
    schemaVersion:SCHEMA_VERSION, seed, createdAt:new Date().toISOString(), year:2026, seasonIndex:1, series:'F1',
    currentRound:0, currentSession:0, phase:'Pre-season', teams, staff, engines:ENGINES, sponsors:SPONSOR_BRANDS,
    drivers, feederTeams:{F2:f2Teams,F3:f3Teams,FE:feTeams,WEC:wecTeams}, calendar, circuitPool:CIRCUIT_POOL,
    sessionResults:[], raceResults:[], feederResults:{F2:[],F3:[],FE:[],WEC:[]}, stories:[], threads:[
      {id:'title-rivalry',title:'A new era at the front',status:'Active',heat:82},
      {id:'famous-rookie',title:'The 18-year-old phenom',status:'Active',heat:88},
      {id:'technical-race',title:'The first development war',status:'Active',heat:73},
      {id:'team-survival',title:'A vulnerable grid slot',status:'Active',heat:61},
      {id:'calendar-evolution',title:'The rotating world calendar',status:'Active',heat:46},
    ],
    records:{fastestLaps:[],youngestWins:[],classicRaces:[],teamLineage:[],driverMilestones:[]},
    seasonArchive:[], awards:[], pendingDecisions:[], storyCounter:0,
    settings:{calendarChurn:'Conservative',teamDynamism:'Plausible',authenticLock:true,detailLevel:'Full',autoSave:true},
    ui:{selectedSeries:'F1'},
  };
  universe.stories=buildInitialStories(universe);
  universe.storyCounter=universe.stories.length;
  return universe;
}

export function getCountryCode(name) { return countryByName(name).code; }
export function getTeam(universe,id) { return universe.teams.find((team)=>team.id===id) || Object.values(universe.feederTeams).flat().find((team)=>team.id===id); }
export function getDriver(universe,id) { return universe.drivers.find((driver)=>driver.id===id); }
export function getStaff(universe,id) { return universe.staff.find((member)=>member.id===id); }
export function getEngine(universe,id) { return universe.engines.find((engine)=>engine.id===id); }
export function getSponsor(universe,id) { return universe.sponsors.find((sponsor)=>sponsor.id===id); }

export function createProceduralDriver({seed,id,series,teamId,seat=1,rarity='Common',age=17,country=null,rookie=false,academy=null,role='Race driver'}) {
  const rng=makeRng(seed);
  const chosenCountry=country||rng.pick(COUNTRIES).name;
  const driver=createDriver({rng,id,series,teamId,seat,rarity,age,country:chosenCountry,rookie,academy});
  driver.role=role;
  return driver;
}
