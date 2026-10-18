"""Append the source-checked heritage study set without changing existing IDs."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
bp='https://en.banglapedia.org/index.php/'
tourism='https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-tourismboard/2024/12/39676297d79342e5aed6ba4a921f5930.pdf'
rows=[
('Bagha Mosque','বাঘা মসজিদ','Rajshahi',[88.839,24.196],'Mosque','An early-sixteenth-century Sultanate mosque at Bagha. Its brickwork and terracotta panels are key examples of Bengal mosque ornamentation.',bp+'Bagha_Mosque'),
('Kusumba Mosque','কুসুম্বা মসজিদ','Naogaon',[88.682,24.754],'Mosque','A stone-faced mosque at Manda, built in 1558–59 during Afghan rule. Its carved mihrabs and raised prayer gallery distinguish the monument.',bp+'Kusumba_Mosque'),
('Chhota Sona Mosque','ছোট সোনা মসজিদ','Chapainawabganj',[88.143,24.814],'Mosque','A Sultanate mosque in the Bangladesh part of Gaur, built during the reign of Alauddin Husain Shah. Its stone ornament and formerly gilded roof gave it the name Small Golden Mosque.',bp+'Chhota_Sona_Mosque'),
('Darasbari Mosque','দারাসবাড়ি মসজিদ','Chapainawabganj',[88.1344,24.8324],'Mosque','The ruins of a large Gaur mosque built by Yusuf Shah in 1479. Its terracotta decoration and nearby madrasa connect worship with the history of learning.',bp+'Darasbari_Mosque'),
('Atiya Mosque','আতিয়া মসজিদ','Tangail',[89.911,24.184],'Mosque','An early-seventeenth-century mosque at Delduar combining Sultanate and Mughal features. Terracotta panels and a curved cornice are its memorable details.',bp+'Atiya_Mosque'),
('Star Mosque (Tara Masjid)','তারা মসজিদ','Dhaka',[90.401,23.716],'Mosque','An Armanitola mosque dating from the first half of the nineteenth century. Later chini-tikri mosaic decoration and blue star motifs gave the mosque its familiar name.',bp+'Star_Mosque'),
('Khan Muhammad Mridha Mosque','খান মোহাম্মদ মৃধা মসজিদ','Dhaka',[90.385,23.721],'Mosque','A Mughal mosque in Lalbagh dated by inscription to 1704–05. Its three-domed prayer hall stands on a raised terrace with vaulted rooms below.',bp+'Mosque_Architecture'),
('Goaldi Mosque','গোয়ালদী মসজিদ','Narayanganj',[90.598,23.662],'Mosque','A single-domed Sultanate mosque at Sonargaon, dated to 1519 by its inscription. Stone and terracotta mihrab decoration survive in the restored building.',bp+'Goaldi_Mosque'),
('Suhrawardy Udyan','সোহরাওয়ার্দী উদ্যান','Dhaka',[90.398,23.733],'Park & garden','Formerly the Ramna Racecourse, this ground is associated with the 7 March 1971 speech and the Pakistani military surrender on 16 December 1971. It is a major independence-history study location.','https://www.beautifulbangladesh.gov.bd/newsletter/single/446'),
('Ramna Park','রমনা পার্ক','Dhaka',[90.401,23.738],'Park & garden','A long-established public park in central Dhaka with mature trees and a lake. It belongs to the wider historic Ramna landscape and is distinct from nearby Suhrawardy Udyan.','https://old.pwd.gov.bd/about/environment'),
('Bahadur Shah Park','বাহাদুর শাহ পার্ক','Dhaka',[90.412,23.706],'Park & garden','An Old Dhaka park formerly known as Victoria Park. Its memorial connects the site with the uprising of 1857 and the memory of the last Mughal emperor.','https://beautifulbangladesh.gov.bd/cat/heritage/2'),
('Baldah Garden','বলধা গার্ডেন','Dhaka',[90.417,23.718],'Park & garden','A historic botanical garden in Wari established by Narendra Narayan Roy Chaudhury in 1909. Its two sections are called Cybele and Psyche.',bp+'Baldah_Garden'),
('Chandrima Udyan','চন্দ্রিমা উদ্যান','Dhaka',[90.378,23.767],'Park & garden','A park beside Crescent Lake, north of the National Parliament complex. The grounds include the mausoleum of former president Ziaur Rahman.','https://dhaz.touristpolice.gov.bd/pages/static-pages/6922e0b2933eb65569e28388'),
('Lalbagh Fort','লালবাগ কেল্লা','Dhaka',[90.388,23.719],'Fort','An unfinished Mughal fort begun in 1678. The surviving ensemble includes a mosque, the tomb of Pari Bibi and a Diwan-i-Aam with a hammam.',bp+'Lalbagh_Fort'),
('Ahsan Manzil','আহসান মঞ্জিল','Dhaka',[90.406,23.708],'Palace','The former residence of the Dhaka nawabs beside the Buriganga. Its nineteenth-century palace and dome are important landmarks in the history of Old Dhaka.',bp+'Ahsan_Manzil'),
('Kantajew Temple (Kantanagar)','কান্তজিউ মন্দির','Dinajpur',[88.667,25.790],'Temple','An eighteenth-century temple famous for detailed terracotta scenes from epics and everyday life. Its original nine spires were lost in the earthquake of 1897.',bp+'Kantanagar_Temple'),
('Panam City','পানাম নগর','Narayanganj',[90.606,23.656],'Historic town','A historic merchant settlement within the wider Sonargaon area. Its surviving street-front houses reflect nineteenth- and early-twentieth-century trade and architecture.',bp+'Panam'),
('Puthia Rajbari and temples','পুঠিয়া রাজবাড়ি ও মন্দিরসমূহ','Rajshahi',[88.841,24.360],'Palace','A palace and temple ensemble at Puthia. The Rajbari, Govinda Temple and Shiva Temple make this an important location for studying zamindari patronage and Bengal architecture.',tourism+'#page=55'),
('Tajhat Palace','তাজহাট রাজবাড়ি','Rangpur',[89.280,25.725],'Palace','A historic palace at Tajhat, Rangpur, with a broad central stair and imposing frontage. The building houses the Rangpur museum.','https://beautifulbangladesh.gov.bd/loc/rangpur/61'),
('Uttara Ganabhaban (Dighapatia Palace)','উত্তরা গণভবন (দিঘাপতিয়া রাজবাড়ি)','Natore',[89.010,24.440],'Palace','The former palace of the Dighapatia rulers near Natore. The palace grounds and buildings preserve a major example of the region’s zamindari heritage.',tourism+'#page=56'),
]
file=ROOT/'assets/data/places.json';places=json.loads(file.read_text(encoding='utf-8'))
mosque=next(p for p in places if p['id']=='place-1')
mosque.update(name='Shat Gombuj Mosque · Historic Mosque City',bn='ষাটগম্বুজ মসজিদ · ঐতিহাসিক মসজিদের শহর',category='Mosque',aliases=['Shat Gumbad','Sixty Dome Mosque','Shat Gambuj'],note='A fifteenth-century mosque associated with Khan Jahan at Bagerhat. It is a principal monument within the UNESCO-listed Historic Mosque City of Bagerhat.')
for i,(name,bn,district,coords,category,note,source) in enumerate(rows,22):
    record=dict(id=f'place-{i}',name=name,bn=bn,districts=[district],coords=coords,kind='Heritage',category=category,note=note,source=source)
    if category=='Park & garden':record['aliases']=['udyan','uddyan','uddyaan','park','garden','উদ্যান']
    if category=='Mosque':record['aliases']=['masjid','mosjid','মসজিদ']
    places=[p for p in places if p['id']!=record['id']]+[record]
assert len(places)==42 and len({p['id'] for p in places})==42
file.write_text(json.dumps(places,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('42 places: 9 mosques, 5 parks/gardens, 15 other heritage, 3 infrastructure, 10 nature.')
