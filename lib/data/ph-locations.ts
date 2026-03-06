// Philippines provinces, cities, and barangays (curated subset for property management)
// Data sourced from Philippine Standard Geographic Code (PSGC)

export interface PHLocation {
  province: string;
  cities: {
    name: string;
    barangays: string[];
  }[];
}

export const PH_LOCATIONS: PHLocation[] = [
  {
    province: "Metro Manila",
    cities: [
      { name: "Manila", barangays: ["Ermita", "Intramuros", "Malate", "Paco", "Pandacan", "Port Area", "Quiapo", "Sampaloc", "San Miguel", "San Nicolas", "Santa Ana", "Santa Cruz", "Santa Mesa", "Tondo"] },
      { name: "Quezon City", barangays: ["Bagong Pag-asa", "Bahay Toro", "Batasan Hills", "Commonwealth", "Cubao", "Diliman", "Don Manuel", "Fairview", "Kamuning", "Loyola Heights", "New Manila", "North Fairview", "Novaliches", "Project 4", "Project 6", "Project 8", "San Francisco Del Monte", "Talipapa", "Teacher's Village", "Timog"] },
      { name: "Makati", barangays: ["Bel-Air", "Dasmarinas", "Forbes Park", "Guadalupe Nuevo", "Guadalupe Viejo", "Magallanes", "Poblacion", "Rockwell", "Salcedo Village", "San Antonio", "San Lorenzo", "Singkamas", "Urdaneta", "Valenzuela"] },
      { name: "Pasig", barangays: ["Bagong Ilog", "Bagong Katipunan", "Kapitolyo", "Manggahan", "Maybunga", "Oranbo", "Palatiw", "Pinagbuhatan", "Rosario", "Sagad", "San Antonio", "San Joaquin", "San Miguel", "Santolan", "Ugong"] },
      { name: "Taguig", barangays: ["Bagumbayan", "Bambang", "Calzada", "Central Bicutan", "Central Signal Village", "Fort Bonifacio", "Hagonoy", "Ibayo-Tipas", "Katuparan", "Ligid-Tipas", "Lower Bicutan", "Maharlika Village", "Napindan", "New Lower Bicutan", "North Daang Hari", "North Signal Village", "Palingon", "Pinagsama", "San Miguel", "Santa Ana", "South Daang Hari", "South Signal Village", "Tanyag", "Tuktukan", "Upper Bicutan", "Ususan", "Wawa", "Western Bicutan"] },
      { name: "Mandaluyong", barangays: ["Addition Hills", "Bagong Silang", "Barangka Drive", "Barangka Ibaba", "Barangka Ilaya", "Barangka Itaas", "Buayang Bato", "Burol", "Daang Bakal", "Hagdang Bato Itaas", "Hagdang Bato Libis", "Harapin Ang Bukas", "Highway Hills", "Hulo", "Mabini-J. Rizal", "Malamig", "Mauway", "Namayan", "New Zaniga", "Old Zaniga", "Pag-Asa", "Plainview", "Pleasant Hills", "Poblacion", "San Jose", "Vergara", "Wack-Wack Greenhills"] },
      { name: "Pasay", barangays: ["Barangay 1", "Barangay 76", "Barangay 183", "Malibay", "Maricaban", "San Isidro", "San Rafael", "San Roque", "Santa Clara", "Tramo", "Villamor"] },
      { name: "Parañaque", barangays: ["Baclaran", "BF Homes", "Don Bosco", "Don Galo", "La Huerta", "Marcelo Green", "Merville", "Moonwalk", "San Antonio", "San Dionisio", "San Isidro", "San Martin de Porres", "Santo Niño", "Sun Valley", "Tambo", "Vitalez"] },
      { name: "Las Piñas", barangays: ["Almanza Dos", "Almanza Uno", "BF International", "Daniel Fajardo", "Elias Aldana", "Ilaya", "Manuyo Dos", "Manuyo Uno", "Pamplona Dos", "Pamplona Tres", "Pamplona Uno", "Pilar", "Pulang Lupa Dos", "Pulang Lupa Uno", "Talon Dos", "Talon Kuatro", "Talon Singko", "Talon Tres", "Talon Uno", "Zapote"] },
      { name: "Muntinlupa", barangays: ["Alabang", "Ayala Alabang", "Buli", "Cupang", "New Alabang Village", "Poblacion", "Putatan", "Sucat", "Tunasan"] },
      { name: "Caloocan", barangays: ["Bagong Barrio", "Bagong Silang", "Camarin", "Grace Park", "Kaybiga", "Kaunlaran", "Sangandaan", "Tala", "Ugong"] },
      { name: "Malabon", barangays: ["Acacia", "Baritan", "Bayan-Bayanan", "Catmon", "Concepcion", "Dampalit", "Flores", "Hulong Duhat", "Longos", "Maysilo", "Muzon", "Niugan", "Panghulo", "Potrero", "San Agustin", "Santolan", "Tañong", "Tinajeros", "Tonsuya", "Tugatog"] },
      { name: "Navotas", barangays: ["Bagumbayan North", "Bagumbayan South", "Bangculasi", "Daanghari", "Navotas East", "Navotas West", "North Bay Boulevard North", "North Bay Boulevard South", "San Jose", "San Rafael Village", "San Roque", "Sipac-Almacen", "Tangos North", "Tangos South", "Tanza"] },
      { name: "Valenzuela", barangays: ["Arkong Bato", "Bagbaguin", "Balangkas", "Bignay", "Bisig", "Canumay East", "Canumay West", "Coloong", "Dalandanan", "Gen. T. de Leon", "Isla", "Karuhatan", "Lawang Bato", "Lingunan", "Mabolo", "Malanday", "Malinta", "Mapulang Lupa", "Marulas", "Maysan", "Palasan", "Parada", "Pariancillo Villa", "Paso de Blas", "Pasolo", "Poblacion", "Pulo", "Punturin", "Rincon", "Tagalag", "Ugong", "Viente Reales", "Wawang Pulo"] },
      { name: "Marikina", barangays: ["Barangka", "Calumpang", "Concepcion Dos", "Concepcion Uno", "Fortune", "Industrial Valley", "Jesus de la Peña", "Malanday", "Marikina Heights", "Nangka", "Parang", "San Roque", "Santa Elena", "Santo Niño", "Tañong", "Tumana"] },
      { name: "San Juan", barangays: ["Addition Hills", "Balong-Bato", "Batis", "Corazon de Jesus", "Ermitaño", "Greenhills", "Isabelita", "Kabayanan", "Little Baguio", "Maytunas", "Onse", "Pasadena", "Pedro Cruz", "Progreso", "Rivera", "Salapan", "San Perfecto", "Santa Lucia", "St. Joseph", "Tibagan", "West Crame"] },
      { name: "Pateros", barangays: ["Aguho", "Magtanggol", "Martires del 96", "Poblacion", "San Pedro", "San Roque", "Santa Ana", "Santo Rosario-Kanluran", "Santo Rosario-Silangan", "Tabacalera"] }
    ]
  },
  {
    province: "Cavite",
    cities: [
      { name: "Bacoor", barangays: ["Alima", "Aniban I", "Aniban II", "Aniban III", "Banalo", "Bayanan", "Campo Santo", "Daang Bukid", "Digman", "Dulong Bayan", "Habay I", "Habay II", "Kaingin", "Ligas I", "Ligas II", "Ligas III", "Mabolo I", "Mabolo II", "Mabolo III", "Maliksi I", "Maliksi II", "Maliksi III", "Mambog I", "Mambog II", "Mambog III", "Mambog IV", "Mambog V", "Molino I", "Molino II", "Molino III", "Molino IV", "Molino V", "Molino VI", "Molino VII", "Niog I", "Niog II", "Niog III", "Panapaan I", "Panapaan II", "Panapaan III", "Panapaan IV", "Panapaan V", "Panapaan VI", "Panapaan VII", "Panapaan VIII", "Queens Row Central", "Queens Row East", "Queens Row West", "Real I", "Real II", "Salinas I", "Salinas II", "Salinas III", "Salinas IV", "San Nicolas I", "San Nicolas II", "San Nicolas III", "Tabing Dagat", "Talaba I", "Talaba II", "Talaba III", "Talaba IV", "Talaba V", "Talaba VI", "Talaba VII", "Zapote I", "Zapote II", "Zapote III", "Zapote IV", "Zapote V"] },
      { name: "Dasmariñas", barangays: ["Bagong Bayan", "Burol", "Emmanuel Bergado I", "Emmanuel Bergado II", "Fatima I", "Fatima II", "Fatima III", "Langkaan I", "Langkaan II", "Luzviminda I", "Luzviminda II", "Paliparan I", "Paliparan II", "Paliparan III", "Sabang", "Salawag", "Salitran I", "Salitran II", "Salitran III", "Salitran IV", "Sampaloc I", "Sampaloc II", "Sampaloc III", "Sampaloc IV", "Sampaloc V", "San Agustin I", "San Agustin II", "San Agustin III", "San Andres I", "San Andres II", "San Esteban", "San Isidro Labrador I", "San Isidro Labrador II", "San Jose", "San Lorenzo Ruiz I", "San Lorenzo Ruiz II", "San Luis I", "San Luis II", "San Mateo", "San Miguel I", "San Miguel II", "San Nicolas I", "San Nicolas II", "San Roque", "San Simon", "Santa Cristina I", "Santa Cristina II", "Santa Cruz I", "Santa Cruz II", "Santa Fe", "Santa Lucia", "Santo Cristo", "Victoria Reyes", "Zone I-A (Poblacion)", "Zone I-B (Poblacion)", "Zone II (Poblacion)", "Zone III (Poblacion)", "Zone IV (Poblacion)"] },
      { name: "Imus", barangays: ["Alapan I-A", "Alapan I-B", "Alapan I-C", "Alapan II-A", "Alapan II-B", "Anabu I-A", "Anabu I-B", "Anabu I-C", "Anabu I-D", "Anabu I-E", "Anabu I-F", "Anabu I-G", "Anabu II-A", "Anabu II-B", "Anabu II-C", "Anabu II-D", "Anabu II-E", "Anabu II-F", "Bagong Silang", "Bayan Luma I", "Bayan Luma II", "Bayan Luma III", "Bayan Luma IV", "Bayan Luma IX", "Bayan Luma V", "Bayan Luma VI", "Bayan Luma VII", "Bayan Luma VIII", "Bucandala I", "Bucandala II", "Bucandala III", "Bucandala IV", "Bucandala V", "Buhay na Tubig", "Carsadang Bago I", "Carsadang Bago II", "Magdalo", "Maharlika", "Malagasang I-A", "Malagasang I-B", "Malagasang I-C", "Malagasang I-D", "Malagasang I-E", "Malagasang I-F", "Malagasang I-G", "Malagasang II-A", "Malagasang II-B", "Malagasang II-C", "Malagasang II-D", "Malagasang II-E", "Malagasang II-F", "Malagasang II-G", "Mariano Espeleta I", "Mariano Espeleta II", "Mariano Espeleta III", "Medicion I-A", "Medicion I-B", "Medicion I-C", "Medicion I-D", "Medicion II-A", "Medicion II-B", "Medicion II-C", "Medicion II-D", "Medicion II-E", "Medicion II-F", "Palico I", "Palico II", "Palico III", "Palico IV", "Pasong Buaya I", "Pasong Buaya II", "Pinagbuklod", "Poblacion I-A (Pob.)", "Poblacion I-B", "Poblacion I-C", "Poblacion II-A", "Poblacion II-B", "Poblacion III-A", "Poblacion III-B", "Poblacion IV-A", "Poblacion IV-B", "Poblacion IV-C", "Poblacion IV-D", "Tanzang Luma I", "Tanzang Luma II", "Tanzang Luma III", "Tanzang Luma IV", "Tanzang Luma V", "Tanzang Luma VI", "Toclong I-A", "Toclong I-B", "Toclong I-C", "Toclong II-A", "Toclong II-B"] },
      { name: "Kawit", barangays: ["Balsahan-Bisita", "Binakayan-Aplaya", "Binakayan-Kanluran", "Gahak", "Kaingen", "Magdalo (Santa Magdalena)", "Manggahan", "Marulas", "Panamitan", "Poblacion", "Pulvorista", "Putol", "Samala-Marquez", "San Sebastian", "Santa Isabel", "Tabon I", "Tabon II", "Tabon III", "Toclong", "Trece Martires City", "Wakas I", "Wakas II"] },
      { name: "General Trias", barangays: ["Alingaro", "Arnaldo Poblacion", "Bacao I", "Bacao II", "Bagumbayan Poblacion", "Biclatan", "Buenavista I", "Buenavista II", "Buenavista III", "Corregidor Poblacion", "Dulong Bayan Poblacion", "Governor Ferrer Poblacion", "Javalera", "Manggahan", "Navarro", "Ninety Sixth Poblacion", "Panungyanan", "Pasong Camachile I", "Pasong Camachile II", "Pasong Kawayan I", "Pasong Kawayan II", "Pinagtipunan", "Prinza Poblacion", "Sampalucan Poblacion", "San Francisco", "San Gabriel Poblacion", "San Juan I", "San Juan II", "Santa Clara", "Santiago", "Tapia", "Tejero", "Vibora Poblacion"] }
    ]
  },
  {
    province: "Laguna",
    cities: [
      { name: "Santa Rosa", barangays: ["Aplaya", "Balibago", "Caingin", "Dila", "Dita", "Don Jose", "Ibaba", "Kanluran (Poblacion)", "Labas", "Macabling", "Malitlit", "Malusak (Poblacion)", "Market Area (Poblacion)", "Pook", "Pulong Santa Cruz", "Santo Domingo", "Sinalhan", "Tagapo"] },
      { name: "Biñan", barangays: ["Biñan", "Bungahan", "Canlalay", "Casile", "De La Paz", "Ganado", "Langkiwa", "Loma", "Malaban", "Malamig", "Mampalasan", "Platero", "Poblacion", "San Antonio", "San Francisco (Halang)", "San Jose", "San Vicente", "Santo Domingo", "Santo Niño", "Santo Tomas (Calabuso)", "Soro-Soro", "Timbao", "Tubigan", "Zapote"] },
      { name: "Cabuyao", barangays: ["Baclaran", "Banaybanay", "Banlic", "Barangay Uno (Poblacion)", "Barangay Dos (Poblacion)", "Barangay Tres (Poblacion)", "Bigaa", "Butong", "Casile", "Diezmo", "Gulod", "Mamatid", "Marinig", "Niugan", "Pittland", "Pulo", "Sala", "San Isidro"] },
      { name: "San Pedro", barangays: ["Bagong Silang", "Calendola", "Chrysanthemum", "Cuyab", "Estrella", "G.S.I.S.", "Landayan", "Langgam", "Laram", "Magsaysay", "Maharlika", "Narra", "Nueva", "Pacita 1", "Pacita 2", "Poblacion", "Rosario", "Sampaguita Village", "San Antonio", "San Lorenzo Ruiz", "San Roque", "San Vicente", "Santo Niño", "United Bayanihan", "United Better Living"] },
      { name: "Calamba", barangays: ["Bagong Kalsada", "Banadero", "Banlic", "Barandal", "Batino", "Bubuyan", "Bucal", "Bunggo", "Burol", "Camaligan", "Canlubang", "Halang", "Hornalan", "Kay-Anlog", "La Mesa", "Laguerta", "Lawa", "Lecheria", "Lingga", "Looc", "Mabato", "Majada Labas", "Makiling", "Mapagong", "Masili", "Maunong", "Mayapa", "Milagrosa (Tulo)", "Paciano Rizal", "Palingon", "Palo-Alto", "Pansol", "Parian", "Poblacion", "Punta", "Puting Lupa", "Real", "Saimsim", "Sampiruhan", "San Cristobal", "San Jose", "San Juan", "Sirang Lupa", "Sucol", "Turbina", "Ulango", "Uwisan"] }
    ]
  },
  {
    province: "Rizal",
    cities: [
      { name: "Antipolo", barangays: ["Bagong Nayon", "Beverly Hills", "Calawis", "Cupang", "Dalig", "Dela Paz", "Inarawan", "Mambugan", "Mayamot", "Muntindilaw", "San Isidro", "San Jose", "San Juan", "San Luis", "San Roque", "Santa Cruz", "Santo Niño", "Valley Golf"] },
      { name: "Cainta", barangays: ["San Andres", "San Isidro", "San Juan", "San Roque", "Santo Domingo", "Santo Niño"] },
      { name: "Taytay", barangays: ["Dolores", "Mabuhay", "Muzon", "San Isidro", "San Juan", "Santa Ana"] },
      { name: "Rodriguez (Montalban)", barangays: ["Balite", "Burgos", "Geronimo", "Macabud", "Manggahan", "Mascap", "Puray", "Rosario", "San Isidro", "San Jose", "San Rafael"] },
      { name: "San Mateo", barangays: ["Ampid I", "Ampid II", "Banaba", "Dulongbayan", "Guinayang", "Gulod Malaya", "Guitnang Bayan I", "Guitnang Bayan II", "Malanday", "Maly", "Pintong Bocaue", "Poblacion", "Santa Ana", "Santolan", "Silangan"] }
    ]
  },
  {
    province: "Bulacan",
    cities: [
      { name: "Malolos", barangays: ["Anilao", "Atlag", "Babatnin", "Bagna", "Bagong Bayan", "Balayong", "Balite", "Bangkal", "Barihan", "Bulihan", "Bungahan", "Caingin", "Calero", "Caliligawan", "Canalate", "Caniogan", "Catmon", "Cofradia", "Dakila", "Guinhawa", "Ligas", "Liyang", "Longos", "Look 1st", "Look 2nd", "Lugam", "Mabolo", "Mambog", "Masile", "Mojon", "Namayan", "Niugan", "Pamarawan", "Panasahan", "Pinagbakahan", "San Agustin", "San Gabriel", "San Juan", "San Pablo", "San Vicente", "Santiago", "Santisima Trinidad", "Santo Cristo", "Santo Niño", "Santo Rosario", "Santor", "Sumapang Bata", "Sumapang Matanda", "Taal", "Tikay"] },
      { name: "Meycauayan", barangays: ["Bagbaguin", "Bahay Pare", "Bancal", "Banga", "Bayugo", "Calvario", "Camalig", "Hulo", "Iba", "Langka", "Lawa", "Libtong", "Liputan", "Longos", "Malhacan", "Pajo", "Pandayan", "Pantoc", "Perez", "Poblacion", "Saint Francis", "Saluysoy", "Tugatog", "Ubihan", "Zamora"] },
      { name: "Marilao", barangays: ["Abangan Norte", "Abangan Sur", "Ibayo", "Lambakin", "Lias", "Loma de Gato", "Nagbalon", "Patubig", "Poblacion I", "Poblacion II", "Prenza I", "Prenza II", "Santa Rosa I", "Santa Rosa II", "Tabing Ilog"] },
      { name: "San Jose del Monte", barangays: ["Assumption", "Bagong Buhay I", "Bagong Buhay II", "Bagong Buhay III", "Citrus", "Ciudad Real", "Dulong Bayan I", "Dulong Bayan II", "Fatima I", "Fatima II", "Fatima III", "Fatima IV", "Fatima V", "Francisco Homes-Guijo", "Francisco Homes-Mulawin", "Francisco Homes-Narra", "Francisco Homes-Yakal", "Gaya-Gaya", "Graceville", "Gumaoc Central", "Gumaoc East", "Gumaoc West", "Kaybanban", "Kaypian", "Lawang Pari", "Maharlika", "Minuyan I", "Minuyan II", "Minuyan III", "Minuyan IV", "Minuyan Proper", "Minuyan V", "Muzon", "Paradise III", "Poblacion", "San Isidro", "San Manuel", "San Martin I", "San Martin II", "San Martin III", "San Martin IV", "San Pedro", "San Rafael I", "San Rafael III", "San Rafael IV", "San Rafael V", "San Roque", "Santa Cruz I", "Santa Cruz II", "Santa Cruz III", "Santa Cruz IV", "Santa Cruz V", "Santo Cristo", "Santo Niño", "Santo Niño II", "Sapang Palay", "St. Martin de Porres", "Tungkong Mangga"] }
    ]
  },
  {
    province: "Cebu",
    cities: [
      { name: "Cebu City", barangays: ["Adlaon", "Apas", "Banilad", "Basak Pardo", "Basak San Nicolas", "Budla-an", "Bulacao", "Busay", "Calamba", "Capitol Site", "Cogon Pardo", "Cogon Ramos", "Day-as", "Ermita", "Guadalupe", "Guba", "Hipodromo", "Inayawan", "Kalubihan", "Kamagayan", "Kasambagan", "Kinasang-an Pardo", "Labangon", "Lahug", "Lorega-San Miguel", "Lusaran", "Mabini", "Mabolo", "Malubog", "Mambaling", "Pahina Central", "Pahina San Nicolas", "Pamutan", "Pardo", "Pari-an", "Pasil", "Pit-os", "Poblacion Pardo", "Pung-ol-Sibugay", "Punta Princesa", "Quiot Pardo", "Sambag I", "Sambag II", "San Antonio", "San Jose", "San Nicolas Proper", "Santa Cruz", "Sawang Calero", "Sinsin", "Sirao", "Suba", "Sudlon I", "Sudlon II", "T. Padilla", "Tabunan", "Tagba-o", "Taptap", "Tejero", "Tinago", "Tisa", "To-ong Pardo", "Zapatera"] },
      { name: "Mandaue", barangays: ["Alang-Alang", "Bakilid", "Banilad", "Basak", "Cabancalan", "Cambaro", "Canduman", "Casili", "Casuntingan", "Centro (Poblacion)", "Cubacub", "Guizo", "Ibabao-Estancia", "Jagobiao", "Labogon", "Looc", "Maguikay", "Mantuyong", "Opao", "Pagsabungan", "Subangdaku", "Tabok", "Tawason", "Tingub", "Tipolo", "Umapad"] },
      { name: "Lapu-Lapu", barangays: ["Agus", "Babag", "Bankal", "Baring", "Basak", "Buaya", "Calawisan", "Canjulao", "Caw-oy", "Caubian", "Gun-ob", "Ibo", "Looc", "Mactan", "Maribago", "Marigondon", "Olango", "Pajac", "Pangan-an", "Pajo", "Poblacion", "Punta Engaño", "Pusok", "Sabang", "Santa Rosa", "Subabasbas", "Talima", "Tingo", "Tungasan"] },
      { name: "Talisay", barangays: ["Biasong", "Bulawan", "Cadulawan", "Camp IV", "Cansojong", "Dumlog", "Jaclupan", "Kan-irag", "Lagtang", "Lawaan I", "Lawaan II", "Lawaan III", "Linao", "Maghaway", "Manipis", "Mohon", "Poblacion", "Pooc", "San Isidro", "San Roque", "Tabunok", "Tangke"] },
      { name: "Consolacion", barangays: ["Cabangahan", "Cansaga", "Casili", "Danglag", "Garing", "Jugan", "Lamac", "Nangka", "Panas", "Panoypoy", "Pitogo", "Poblacion Occidental", "Poblacion Oriental", "Polog", "Pulpogan", "Sacsac", "Tayud", "Tilhaong", "Tolotolo", "Tugbongan"] }
    ]
  }
];

export function getProvinces(): string[] {
  return PH_LOCATIONS.map(l => l.province);
}

export function getCitiesForProvince(province: string): string[] {
  const loc = PH_LOCATIONS.find(l => l.province === province);
  return loc ? loc.cities.map(c => c.name) : [];
}

export function getBarangaysForCity(province: string, city: string): string[] {
  const loc = PH_LOCATIONS.find(l => l.province === province);
  if (!loc) return [];
  const cityData = loc.cities.find(c => c.name === city);
  return cityData ? cityData.barangays : [];
}
















