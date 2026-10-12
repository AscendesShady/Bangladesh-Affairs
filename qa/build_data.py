"""Rebuild bundled study data from curated records and the saved DPDT registry."""
import json
from pathlib import Path
from lxml import html
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/data'

def save(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

# Canonical names are joined explicitly to the 2020 boundary dataset's older spellings.
# Rivers are examples, not exhaustive drainage inventories. Highlights are study anchors.
district_rows = '''
Dhaka|ঢাকা|Dhaka|Buriganga, Dhaleshwari|Lalbagh Fort; National Martyrs' Memorial at Savar|National capital and a major administrative, educational and industrial centre.
Faridpur|ফরিদপুর|Dhaka|Padma, Kumar|Jasimuddin's home; jute-growing landscape|The floodplain connects farming, inland waterways and the heritage of poet Jasimuddin.
Gazipur|গাজীপুর|Dhaka|Turag, Shitalakshya|Bhawal National Park; Bangladesh Rice Research Institute|Sal forest landscapes sit alongside research institutions and garment industries.
Gopalganj|গোপালগঞ্জ|Dhaka|Madhumati, Kumar|Tungipara; Orakandi|Tungipara is associated with Sheikh Mujibur Rahman's birthplace and mausoleum.
Kishoreganj|কিশোরগঞ্জ|Dhaka|Meghna, Old Brahmaputra|Sholakia Eidgah; Nikli haor|Eastern haors make seasonal water levels central to farming and transport.
Madaripur|মাদারীপুর|Dhaka|Arial Khan, Kumar|Shibchar; Rajaram Temple|Shibchar is part of the southern approach area of the Padma Bridge corridor.
Manikganj|মানিকগঞ্জ|Dhaka|Padma, Jamuna, Dhaleshwari|Baliati Palace; Aricha river crossing|Near the Padma–Jamuna confluence, rivers shape trade and settlement.
Munshiganj|মুন্সীগঞ্জ|Dhaka|Padma, Meghna, Dhaleshwari|Bikrampur; Mawa end of Padma Bridge|Historic Bikrampur and the Padma Bridge connect heritage with modern infrastructure.
Narayanganj|নারায়ণগঞ্জ|Dhaka|Shitalakshya, Dhaleshwari|Sonargaon; Panam City; Jamdani weaving|A river-port and textile district closely associated with Jamdani craftsmanship.
Narsingdi|নরসিংদী|Dhaka|Meghna, Shitalakshya|Wari-Bateshwar; handloom textile centres|Wari-Bateshwar is an important archaeological site for studying early settlement and trade.
Rajbari|রাজবাড়ী|Dhaka|Padma, Garai|Goalanda river-port area|Goalanda's river junction made it an important transport connection.
Shariatpur|শরীয়তপুর|Dhaka|Padma, Meghna|Jajira end of Padma Bridge|River erosion, chars and the bridge corridor are useful geographical study themes.
Tangail|টাঙ্গাইল|Dhaka|Jamuna, Dhaleshwari|Madhupur forest; Tangail handloom; Atia Mosque|Handloom traditions and the Madhupur tract connect culture with physical geography.
Chattogram|চট্টগ্রাম|Chattogram|Karnaphuli, Halda|Chattogram seaport; Halda River; Sitakunda|A major seaport district; the Halda is important for natural carp spawning.
Bandarban|বান্দরবান|Chattogram|Sangu, Matamuhuri|Boga Lake; hill landscapes|One of the three Chittagong Hill Tracts districts, with diverse communities and hill ecosystems.
Brahmanbaria|ব্রাহ্মণবাড়িয়া|Chattogram|Titas, Meghna|Titas River; Ashuganj; Akhaura|Ashuganj's river and power infrastructure and Akhaura's border links are key study anchors.
Chandpur|চাঁদপুর|Chattogram|Padma, Meghna, Dakatia|Padma–Meghna meeting area; hilsa fisheries|River confluence, fisheries and erosion are closely linked here.
Cumilla|কুমিল্লা|Chattogram|Gumti, Dakatia|Mainamati; Shalban Vihara; BARD|Buddhist archaeological remains and rural-development research are important features.
Cox's Bazar|কক্সবাজার|Chattogram|Bakkhali, Naf|Sea beach; Teknaf; Saint Martin's Island|A southeastern coastal district bordering Myanmar at the Naf River.
Feni|ফেনী|Chattogram|Feni, Muhuri|Muhuri irrigation project|The Feni–Muhuri river system is important for irrigation and floodplain agriculture.
Khagrachhari|খাগড়াছড়ি|Chattogram|Chengi, Maini|Alutila; hill valleys|One of the three Chittagong Hill Tracts districts, with Chakma, Marma and Tripura communities.
Lakshmipur|লক্ষ্মীপুর|Chattogram|Meghna|Ramgati; Meghna estuary|Estuarine chars, fishing and erosion are central geographical themes.
Noakhali|নোয়াখালী|Chattogram|Lower Meghna|Hatiya; Nijhum Dwip|Estuarine islands and coastal afforestation connect land formation with biodiversity.
Rangamati|রাঙামাটি|Chattogram|Karnaphuli, Kassalong|Kaptai Lake; Kaptai hydropower|Kaptai Lake links energy, displacement history, fisheries and hill ecosystems.
Rajshahi|রাজশাহী|Rajshahi|Padma|Varendra Research Museum; silk; Barind tract|A centre for silk and heritage studies beside the Padma and the Barind region.
Bogura|বগুড়া|Rajshahi|Karatoya, Bangali|Mahasthangarh; doi|Mahasthangarh preserves the remains of ancient Pundranagara.
Chapainawabganj|চাঁপাইনবাবগঞ্জ|Rajshahi|Mahananda, Padma|Choto Sona Mosque; mango orchards|The district is strongly associated with mango cultivation and medieval mosque architecture.
Joypurhat|জয়পুরহাট|Rajshahi|Little Jamuna, Tulshiganga|Sugar industry; agricultural landscape|A northwestern agricultural district associated with sugarcane and Latiraj kachu.
Naogaon|নওগাঁ|Rajshahi|Atrai, Little Jamuna|Paharpur; Kusumba Mosque|Paharpur's Somapura Mahavihara is a UNESCO World Heritage property.
Natore|নাটোর|Rajshahi|Atrai, Baral|Chalan Beel; Natore Rajbari|Wetland farming and the Chalan Beel landscape accompany the district's palace heritage.
Pabna|পাবনা|Rajshahi|Padma, Ichamati|Hardinge Bridge; Ishwardi; Rooppur|Ishwardi is an important transport and energy-infrastructure area.
Sirajganj|সিরাজগঞ্জ|Rajshahi|Jamuna, Baral|Handloom centres; Jamuna riverbank|Handloom textiles and riverbank erosion are closely connected to local life.
Khulna|খুলনা|Khulna|Rupsa, Pasur, Bhairab|Sundarbans gateway; Rupsa River|Southwestern tidal rivers support transport, fisheries and access to the Sundarbans.
Bagerhat|বাগেরহাট|Khulna|Pasur, Baleshwar|Historic Mosque City; Mongla; Sundarbans|The Historic Mosque City of Bagerhat is a UNESCO World Heritage property.
Chuadanga|চুয়াডাঙ্গা|Khulna|Mathabhanga, Bhairab|Darshana; agriculture|Darshana is an important railway and border-trade connection.
Jashore|যশোর|Khulna|Bhairab, Kopotaksha|Benapole; Sagardari; date-palm jaggery|Sagardari is associated with poet Michael Madhusudan Dutt.
Jhenaidah|ঝিনাইদহ|Khulna|Nabaganga, Chitra|Barobazar archaeological sites|Historic religious architecture and agriculture are useful study anchors.
Kushtia|কুষ্টিয়া|Khulna|Padma, Gorai|Shilaidaha Kuthibari; Lalon's shrine|Rabindranath Tagore and Lalon connect the district to literary and musical heritage.
Magura|মাগুরা|Khulna|Nabaganga, Kumar|Hazrapur litchi-growing area|An agricultural district associated with Hazrapuri litchi.
Meherpur|মেহেরপুর|Khulna|Bhairab|Mujibnagar memorial|The provisional Bangladesh government took its oath at Baidyanathtala on 17 April 1971.
Narail|নড়াইল|Khulna|Chitra, Nabaganga|S. M. Sultan's artistic legacy|The district is associated with artist S. M. Sultan and the Chitra River.
Satkhira|সাতক্ষীরা|Khulna|Kopotaksha, Ichamati|Sundarbans; Shyamnagar; coastal aquaculture|Salinity, cyclone exposure and mangrove conservation are closely connected here.
Barishal|বরিশাল|Barishal|Kirtankhola, Arial Khan|Kirtankhola river-port; floating cultivation in the wider region|An important river-port district in the southern delta.
Barguna|বরগুনা|Barishal|Payra, Bishkhali, Baleshwar|Patharghata fishing area|Fishing livelihoods and cyclone preparedness are major coastal themes.
Bhola|ভোলা|Barishal|Meghna, Tetulia|Bhola island; estuarine chars|A major deltaic island district shaped by erosion and sediment deposition.
Jhalokathi|ঝালকাঠি|Barishal|Sugandha, Bishkhali|Gabkhan canal; guava-growing waterways|Canal transport and water-based agriculture are important local features.
Patuakhali|পটুয়াখালী|Barishal|Payra, Tetulia|Kuakata; Payra seaport|Kuakata and Payra link coastal geography, tourism and maritime infrastructure.
Pirojpur|পিরোজপুর|Barishal|Baleshwar, Kacha|Floating cultivation; riverine landscape|Waterlogged landscapes support distinctive local agricultural adaptations.
Sylhet|সিলেট|Sylhet|Surma, Kushiyara|Ratargul; Jaflong; tea landscape|Rivers, foothills and wetlands connect the northeast with upstream catchments.
Habiganj|হবিগঞ্জ|Sylhet|Khowai, Kushiyara|Rema-Kalenga; gas fields; tea gardens|Forest conservation, tea and energy resources are important study themes.
Moulvibazar|মৌলভীবাজার|Sylhet|Manu, Dhalai|Sreemangal; Lawachara; Hakaluki Haor|Tea gardens, forest biodiversity and haor wetlands meet in this district.
Sunamganj|সুনামগঞ্জ|Sylhet|Surma, Jadukata|Tanguar Haor; Hason Raja heritage|Haor biodiversity and pre-monsoon flash floods are major study themes.
Rangpur|রংপুর|Rangpur|Teesta, Ghaghat|Tajhat Palace; Shataranji; Haribhanga mango|Handicrafts and agricultural heritage accompany the Teesta-region landscape.
Dinajpur|দিনাজপুর|Rangpur|Punarbhaba, Atrai|Kantajew Temple; Kataribhog; Barapukuria|Temple architecture, aromatic rice and energy resources are key study anchors.
Gaibandha|গাইবান্ধা|Rangpur|Jamuna, Teesta, Ghaghat|River chars; agricultural floodplain|Flooding and river erosion influence char livelihoods and settlement.
Kurigram|কুড়িগ্রাম|Rangpur|Brahmaputra, Dharla, Teesta|Dharla River; Brahmaputra chars|Northern river floodplains and chars are central to the district's geography.
Lalmonirhat|লালমনিরহাট|Rangpur|Teesta, Dharla|Burimari land port; Teesta corridor|The northern border and Teesta floodplain connect transport with agriculture.
Nilphamari|নীলফামারী|Rangpur|Teesta|Saidpur railway workshop; Teesta Barrage at Dalia|Rail infrastructure and irrigation are important features.
Panchagarh|পঞ্চগড়|Rangpur|Mahananda, Karatoya|Tetulia; northern tea gardens; Banglabandha|Bangladesh's northernmost district links border trade and newer tea-growing areas.
Thakurgaon|ঠাকুরগাঁও|Rangpur|Tangon, Punarbhaba|Agricultural plains; Tangon River|A northern agricultural district connected to the Tangon–Punarbhaba landscape.
Mymensingh|ময়মনসিংহ|Mymensingh|Old Brahmaputra|Bangladesh Agricultural University; Muktagacha|Agricultural education and the Old Brahmaputra shape the district's study profile.
Jamalpur|জামালপুর|Mymensingh|Jamuna, Old Brahmaputra|Nakshi Kantha; floodplain settlements|Embroidered quilt traditions and riverine agriculture are important features.
Netrokona|নেত্রকোণা|Mymensingh|Someshwari, Kangsha|Birishiri; Bijoypur clay; haor landscape|Northern foothills and eastern haors connect mineral resources with water landscapes.
Sherpur|শেরপুর|Mymensingh|Bhogai, Chellakhali|Garo foothills; Tulshimala rice|Foothill ecosystems and aromatic rice are useful study anchors.
'''
districts = []
aliases = {'Barisal':'Barishal','Bogra':'Bogura','Brahamanbaria':'Brahmanbaria','Chittagong':'Chattogram','Comilla':'Cumilla','Chuadanga':'Chuadanga','Jessore':'Jashore','Jhalokati':'Jhalokathi','Maulvibazar':'Moulvibazar','Nawabganj':'Chapainawabganj','Netrakona':'Netrokona'}
bp_names = {'Chattogram':'Chittagong','Cumilla':'Comilla','Barishal':'Barisal','Bogura':'Bogra','Jashore':'Jessore','Chapainawabganj':'Nawabganj','Netrokona':'Netrokona','Jhalokathi':'Jhalokati','Moulvibazar':'Maulvibazar',"Cox's Bazar":'Cox%E2%80%99s_Bazar'}
for row in district_rows.strip().splitlines():
    name,bn,division,rivers,landmarks,note = row.split('|')
    districts.append(dict(id=name.lower().replace("'",'').replace(' ','-'),name=name,bn=bn,division=division,rivers=rivers.split(', '),landmarks=landmarks.split('; '),note=note,source='https://en.banglapedia.org/index.php?title='+bp_names.get(name,name).replace(' ','_')+'_District'))
geo = json.loads((OUT/'districts.geojson').read_text(encoding='utf-8'))
for f in geo['features']:
    f['properties']['name'] = aliases.get(f['properties']['shapeName'], f['properties']['shapeName'])
assert set(f['properties']['name'] for f in geo['features']) == set(d['name'] for d in districts)
save('districts.geojson',geo)
save('district-info.json',districts)

gi_en = '''Jamdani saree|Bangladesh hilsa|Khirsapat mango|Bijoypur white clay|Dinajpur Kataribhog rice|Bangladesh Kalijira rice|Rangpur Shataranji|Rajshahi silk|Dhakai Muslin|Rajshahi–Chapainawabganj Fazli mango|Bangladesh Bagda shrimp|Bangladesh Shital Pati|Bogura doi|Sherpur Tulshimala rice|Chapainawabganj Langra mango|Chapainawabganj Ashwina mango|Natore Kachagolla|Black Bengal goat|Porabari Chomchom|Cumilla Rasmalai|Kushtia Tiler Khaja|Rangpur Haribhanga mango|Moulvibazar agarwood|Moulvibazar agar attar|Muktagacha Monda|Jashore date-palm jaggery|Narsingdi Amrit Sagar banana|Rajshahi sweet betel leaf|Gopalganj Rasgolla|Jamalpur Nakshi Kantha|Tangail saree|Narsingdi lotkon|Madhupur pineapple|Bhola buffalo-milk curd|Magura Hazrapuri litchi|Sirajganj Gamcha|Sylhet Manipuri saree|Mirpur Katan saree|Dhakai Phuti Karpas cotton|Cumilla Khadi|Brahmanbaria Chanamukhi|Gopalganj bronze jewellery|Sundarbans honey|Sherpur Chhanar Payesh|Sirajganj Lungi|Gazipur jackfruit|Kishoreganj Rata Boro rice|Austagram cheese|Barishal hog plum|Kumarkhali bedsheet|Dinajpur Bedana litchi|Munshiganj Patkhir|Naogaon Nak Fazli mango|Jamurki Sandesh|Dhakai Phuti Karpas seeds and plants|Meherpur Mehersagar banana|Netrokona Balish Mishti|Fulbaria red sugar|Meherpur Himsagar mango|Faridpur jute|Meherpur Sabitri sweet|Kaliganj towel|Joypurhat Latiraj kachu|Manikganj Hazari jaggery'''.split('|')
# National/region-wide products deliberately have multiple or no district associations.
gi_places = [['Narayanganj'],['Chandpur','Bhola'],['Chapainawabganj'],['Netrokona'],['Dinajpur'],[],['Rangpur'],['Rajshahi'],['Dhaka','Narayanganj'],['Rajshahi','Chapainawabganj'],['Khulna','Satkhira','Bagerhat'],['Sylhet'],['Bogura'],['Sherpur'],['Chapainawabganj'],['Chapainawabganj'],['Natore'],[],['Tangail'],['Cumilla'],['Kushtia'],['Rangpur'],['Moulvibazar'],['Moulvibazar'],['Mymensingh'],['Jashore'],['Narsingdi'],['Rajshahi'],['Gopalganj'],['Jamalpur'],['Tangail'],['Narsingdi'],['Tangail'],['Bhola'],['Magura'],['Sirajganj'],['Sylhet','Moulvibazar'],['Dhaka'],['Dhaka','Narayanganj'],['Cumilla'],['Brahmanbaria'],['Gopalganj'],['Bagerhat','Khulna','Satkhira'],['Sherpur'],['Sirajganj'],['Gazipur'],['Kishoreganj'],['Kishoreganj'],['Barishal'],['Kushtia'],['Dinajpur'],['Munshiganj'],['Naogaon'],['Tangail'],['Dhaka','Narayanganj'],['Meherpur'],['Netrokona'],['Mymensingh'],['Meherpur'],['Faridpur'],['Meherpur'],['Gazipur'],['Joypurhat'],['Manikganj']]
doc = html.fromstring((ROOT/'sources/gi-registry.html').read_text(encoding='utf-8'))
digits = str.maketrans('০১২৩৪৫৬৭৮৯','0123456789')
gis=[]
for row in doc.xpath('//table//tr'):
    cells=[' '.join(' '.join(c.itertext()).split()) for c in row.xpath('./td')]
    if len(cells)!=7 or not cells[0].translate(digits).isdigit(): continue
    n=int(cells[6].translate(digits))
    if not 1<=n<=64: continue
    category = 'Craft & textile' if n in [1,7,8,9,12,30,31,36,37,38,40,42,45,50,62] else 'Natural material' if n in [4,23,24,39,55,60] else 'Food & agriculture'
    gis.append(dict(id='gi-'+str(n),number=n,name=gi_en[n-1],bn=cells[3],applicationDate=cells[2],application=cells[1],category=category,districts=gi_places[n-1],scope='National or wider regional association' if n in [2,6,11,12,18,43] else 'Study association; consult registration for legal production area',source='dpdt'))
gis.sort(key=lambda x:x['number'])
assert [g['number'] for g in gis]==list(range(1,65))
save('gi.json',gis)

community_rows = '''
Chakma|চাকমা|Rangamati,Khagrachhari,Bandarban|Biju is an important New Year festival; the Chakma language has its own script.|Chakma,_The
Marma|মারমা|Bandarban,Khagrachhari,Rangamati|Sangrai is a major festival; Marma language and weaving traditions are important cultural features.|Marma,_The
Tripura|ত্রিপুরা|Khagrachhari,Bandarban,Rangamati|Kokborok is a major community language; Garia is an important traditional festival.|Tripura,_The
Mro|ম্রো|Bandarban|A hill community with a distinct language and cultural traditions; often called Murong in older references.|Mro,_The
Tanchangya|তঞ্চঙ্গ্যা|Rangamati,Bandarban|A distinct community with its own language and Bisu New Year traditions.|Tanchangya,_The
Bawm|বম|Bandarban,Rangamati|A hill community with distinct language and textile traditions.|Bawm,_The
Khumi|খুমি|Bandarban|A community associated with the southern Chittagong Hill Tracts.|Khumi,_The
Khyang|খিয়াং|Bandarban,Rangamati|A distinct hill community; Khyang and Khumi are different community names.|Khyang,_The
Pankhua|পাংখোয়া|Rangamati|A community with its own language and traditions in the Chittagong Hill Tracts.|Pankhua,_The
Lushai|লুসাই|Rangamati,Bandarban|A community connected with the wider Mizo cultural and linguistic region.|Lushai,_The
Chak|চাক|Bandarban|A distinct community; Chak and Chakma should not be treated as interchangeable names.|Chak,_The
Garo / Mandi|গারো / মান্দি|Mymensingh,Netrokona,Sherpur,Tangail,Jamalpur,Gazipur|Matrilineal inheritance and Wangala are important study themes. Mandi and A'chik are community self-designations.|Garo,_The
Hajong|হাজং|Netrokona,Sherpur,Mymensingh,Sunamganj|A community of the northern foothill region with its own language and agricultural heritage.|Hajong,_The
Khasi|খাসি|Moulvibazar,Sylhet|Khasi communities are associated with the northeastern hills; matrilineal descent and betel cultivation are study themes.|Khasi,_The
Manipuri|মণিপুরি|Moulvibazar,Sylhet,Habiganj|Weaving and dance traditions are important; the label includes diverse linguistic and religious communities.|Manipuri,_The
Santal|সাঁওতাল|Rajshahi,Naogaon,Dinajpur,Gaibandha,Joypurhat,Rangpur|Santali is an Austroasiatic language; Sohrai and Baha are important festival traditions.|Santals,_The
Oraon|ওঁরাও|Rajshahi,Naogaon,Dinajpur,Rangpur|Kurukh is a Dravidian language. Oraon and Santal are distinct communities.|Oraon,_The
Rakhine|রাখাইন|Cox's Bazar,Patuakhali,Barguna|Coastal Rakhine communities have distinctive Buddhist, linguistic and weaving traditions.|Rakhain,_The
Munda|মুন্ডা|Satkhira,Khulna|Munda communities are present in the southwest, including the Sundarbans-adjacent region.|Munda,_The
Koch|কোচ|Sherpur,Jamalpur,Mymensingh,Tangail|A community associated with the northern border and forest regions.|Koch,_The
'''
communities=[]
for i,row in enumerate(community_rows.strip().splitlines()):
    name,bn,places,note,page=row.split('|')
    communities.append(dict(id='community-'+str(i),name=name,bn=bn,districts=places.split(','),note=note,source='https://en.banglapedia.org/index.php?title='+page))
save('communities.json',communities)

# Locatable places; coordinates are indicative study anchors, not navigational data.
place_rows = '''
Paharpur|পাহাড়পুর|Naogaon|88.977,25.031|Heritage|Somapura Mahavihara: UNESCO inscription in 1985.|https://whc.unesco.org/en/list/322/
Historic Mosque City|ঐতিহাসিক মসজিদের শহর|Bagerhat|89.737,22.674|Heritage|The Bagerhat mosque city was inscribed by UNESCO in 1985.|https://whc.unesco.org/en/list/321/
Sundarbans|সুন্দরবন|Khulna,Satkhira,Bagerhat|89.5,22.05|Nature|Mangrove ecosystems connect biodiversity, coastal livelihoods and storm protection; UNESCO inscription in 1997.|https://whc.unesco.org/en/list/798/
Mahasthangarh|মহাস্থানগড়|Bogura|89.343,24.962|Heritage|Ancient Pundranagara: a key archaeological anchor for early Bengal.|https://en.banglapedia.org/index.php?title=Mahasthangarh
Mainamati|ময়নামতি|Cumilla|91.136,23.426|Heritage|Buddhist archaeological remains include Shalban Vihara.|https://en.banglapedia.org/index.php?title=Mainamati
Wari-Bateshwar|উয়ারী-বটেশ্বর|Narsingdi|90.704,24.08|Heritage|Early settlement and trade are important archaeological study themes.|https://en.banglapedia.org/index.php?title=Wari-Bateshwar
National Martyrs' Memorial|জাতীয় স্মৃতিসৌধ|Dhaka|90.255,23.911|Heritage|Savar's memorial commemorates the martyrs of the Liberation War.|https://en.banglapedia.org/index.php?title=National_Memorial
Mujibnagar|মুজিবনগর|Meherpur|88.599,23.65|Heritage|The provisional government's oath-taking site, 17 April 1971.|https://en.banglapedia.org/index.php?title=Mujibnagar_Government
Sonargaon|সোনারগাঁ|Narayanganj|90.599,23.65|Heritage|Historic urban heritage and Jamdani traditions connect this area to Bengal's textile history.|https://en.banglapedia.org/index.php?title=Sonargaon
Shilaidaha|শিলাইদহ|Kushtia|89.222,23.919|Heritage|Kuthibari is associated with Rabindranath Tagore.|https://en.banglapedia.org/index.php?title=Shilaidaha_Kuthibari
Kaptai Lake|কাপ্তাই হ্রদ|Rangamati|92.228,22.652|Nature|A reservoir linked to hydropower, fishing and displacement of hill communities.|https://en.banglapedia.org/index.php?title=Kaptai_Lake
Tanguar Haor|টাঙ্গুয়ার হাওর|Sunamganj|91.068,25.126|Nature|A Ramsar wetland; northeast haors face pre-monsoon flash-flood exposure.|https://rsis.ramsar.org/ris/1031
Hakaluki Haor|হাকালুকি হাওর|Moulvibazar,Sylhet|92.021,24.655|Nature|A major northeastern wetland supporting fisheries and bird habitats.|https://en.banglapedia.org/index.php?title=Hakaluki_Haor
Lawachara|লাউয়াছড়া|Moulvibazar|91.783,24.332|Nature|Forest biodiversity and conservation in the northeastern tea-growing region.|https://en.banglapedia.org/index.php?title=Lawachara_National_Park
Madhupur tract|মধুপুর গড়|Tangail,Gazipur|90.044,24.587|Nature|An elevated terrace with sal forests; forest-dependent livelihoods and land-use change matter here.|https://en.banglapedia.org/index.php?title=Madhupur_Tract
Barind tract|বরেন্দ্র অঞ্চল|Rajshahi,Naogaon,Chapainawabganj|88.54,24.657|Nature|An elevated terrace where dry-season water management is an important theme.|https://en.banglapedia.org/index.php?title=Barind_Tract
Kuakata coast|কুয়াকাটা|Patuakhali|90.12,21.816|Nature|A coastal study anchor for tourism, cyclone preparedness and shoreline change.|https://en.banglapedia.org/index.php?title=Kuakata
Nijhum Dwip|নিঝুম দ্বীপ|Noakhali|91.034,22.055|Nature|An estuarine island associated with coastal afforestation and wildlife habitat.|https://en.banglapedia.org/index.php?title=Nijhum_Dwip
Halda River|হালদা নদী|Chattogram|91.874,22.494|Nature|An important natural carp-spawning river; water quality and habitat protection matter.|https://en.banglapedia.org/index.php?title=Halda_River
Padma Bridge|পদ্মা সেতু|Munshiganj,Shariatpur,Madaripur|90.267,23.436|Infrastructure|Inaugurated on 25 June 2022; connects the southwest with the capital region.|https://ispr.gov.bd/en/bangladesh-air-force-shows-an-amazing-fly-past-in-inauguration-ceremony-of-padma-multipurpose-bridge/
Chattogram port|চট্টগ্রাম বন্দর|Chattogram|91.81,22.313|Infrastructure|A major maritime trade gateway on the Karnaphuli.|https://cpa.gov.bd/
Mongla port|মোংলা বন্দর|Bagerhat|89.595,22.489|Infrastructure|A southwestern seaport on the Pasur river system.|https://mpa.gov.bd/
'''
places=[]
for i,row in enumerate(place_rows.strip().splitlines()):
    name,bn,ds,coords,kind,note,source=row.split('|')
    places.append(dict(id='place-'+str(i),name=name,bn=bn,districts=ds.split(','),coords=[float(v) for v in coords.split(',')],kind=kind,note=note,source=source))
save('places.json',places)

# Use verified article titles (rather than guessed singular forms).
community_sources={'Chakma':'Chakmas,_The','Tripura':'Tribal_Languages','Mro':'Mru,_The','Khumi':'Chittagong_Hill_Tracts','Khyang':'Khyang','Pankhua':'Pankho,_The','Lushai':'Lushei,_The','Hajong':'Hajongs','Khasi':'Khasia,_The','Munda':'Munda','Koch':'Koch'}
for c in communities:
    if c['name'] in community_sources:c['source']='https://en.banglapedia.org/index.php?title='+community_sources[c['name']]
    if c['name']=='Pankhua':c['districts']=['Rangamati','Bandarban']
    if c['name']=='Tripura':c['note']='Kokborok (also written Kokbarak or Tipra in references) is an important community language. Tripura communities live in several hill districts.'
    if c['name']=='Koch':c['districts']=['Sherpur']
place_sources={'Mahasthangarh':'Mahasthan',"National Martyrs' Memorial":'National_Martyrs%E2%80%99_Memorial','Shilaidaha':'Shilaidaha_Kuthibadi','Tanguar Haor':'Tanguar_Haor','Lawachara':'Kamalganj_Upazila','Nijhum Dwip':'Hatiya_Upazila','Chattogram port':'Chittagong_Port','Mongla port':'Mongla_Port'}
for p in places:
    if p['name'] in place_sources:p['source']='https://en.banglapedia.org/index.php?title='+place_sources[p['name']]
save('communities.json',communities)
save('places.json',places)

meta={'checked':'2026-10-12','giRegistryUpdated':'2026-06-16','boundaryYear':'2020','boundaryID':'BGD-ADM2-16705992','boundarySource':'Bangladesh Bureau of Statistics / OCHA ROAP, via geoBoundaries','boundaryLicense':'CC BY 3.0 IGO','boundaryURL':'https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/','geometryURL':'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/BGD/ADM2/geoBoundaries-BGD-ADM2_simplified.geojson'}
save('metadata.json',meta)
(ROOT/'sources/geoboundaries-metadata.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
for size in [192,512]:
    im=Image.new('RGB',(size,size),'#0c5046'); draw=ImageDraw.Draw(im)
    draw.rounded_rectangle((size*.12,size*.12,size*.88,size*.88),radius=size*.16,fill='#f5f1e6')
    # Original abstract river-and-sun mark, with a safe inset for maskable icons.
    draw.ellipse((size*.42,size*.24,size*.68,size*.50),fill='#df6952')
    points=[(size*.34,size*.27),(size*.40,size*.42),(size*.33,size*.57),(size*.47,size*.71),(size*.43,size*.79)]
    draw.line(points,fill='#0c5046',width=int(size*.09),joint='curve')
    im.save(ROOT/f'assets/icons/icon-{size}.png')
print(f'Built {len(districts)} districts, {len(gis)} GI products, {len(communities)} communities and {len(places)} places.')
