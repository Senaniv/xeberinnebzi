import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#dc2626',
      icon TEXT DEFAULT 'newspaper',
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category_id INTEGER,
      summary TEXT,
      content TEXT NOT NULL,
      image_url TEXT,
      author TEXT DEFAULT 'Redaksiya',
      tags TEXT,
      is_manshet INTEGER DEFAULT 0, -- 1 = Böyük Manşet, 2 = Yan Manşet, 0 = Adi
      is_breaking INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      read_time INTEGER DEFAULT 3,
      status TEXT DEFAULT 'published', -- 'published', 'draft'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS breaking_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT,
      article_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      total_votes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      reaction_type TEXT NOT NULL, -- 'like', 'heart', 'wow', 'sad', 'angry'
      count INTEGER DEFAULT 0,
      UNIQUE(article_id, reaction_type),
      FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Check if categories already seeded
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, slug, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
    const cats = [
      ['Siyasət', 'siyaset', '#dc2626', 'landmark', 1],
      ['İqtisadiyyat', 'iqtisadiyyat', '#059669', 'trending-up', 2],
      ['Cəmiyyət', 'cemiyyet', '#2563eb', 'users', 3],
      ['Dünya', 'dunya', '#7c3aed', 'globe', 4],
      ['İdman', 'idman', '#d97706', 'trophy', 5],
      ['Mədəniyyət', 'medeniyyet', '#db2777', 'palette', 6],
      ['Texnologiya', 'texnologiya', '#0891b2', 'cpu', 7],
      ['Analitika', 'analitika', '#4f46e5', 'file-text', 8],
      ['Hərbi', 'herbi', '#475569', 'shield', 9],
    ];

    for (const c of cats) {
      insertCat.run(c[0], c[1], c[2], c[3], c[4]);
    }
  }

  // Check if articles already seeded
  const artCount = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
  if (artCount === 0) {
    const insertArt = db.prepare(`
      INSERT INTO articles (
        title, slug, category_id, summary, content, image_url, author, tags,
        is_manshet, is_breaking, is_featured, views, likes, read_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const articles = [
      {
        title: "Azərbaycan və Qardaş Türkiyə arasında yeni strateji iqtisadi və enerji sazişləri imzalandı",
        slug: "azerbaycan-turkiye-yeni-iqtisadi-ve-enerji-sazisleri-imzalandi",
        category_id: 1, // Siyasət
        summary: "Bakıda keçirilən Yüksək Səviyyəli Əməkdaşlıq Şurasının iclasında iki ölkə arasında yaşıl enerji dəhlizi və ticarət dövriyyəsinin 15 milyard dollara çatdırılması barədə mühüm sənədlər qəbul edildi.",
        content: `Azərbaycan Respublikasının paytaxtı Bakıda keçirilən Yüksək Səviyyəli Strateji Əməkdaşlıq Şurasının növbəti iclasında ikitərəfli əlaqələrin yeni mərhələsinə qədəm qoyuldu.

Görüş zamanı dövlət başçıları qardaş ölkələr arasındakı müttəfiqlik münasibətlərinin Şuşa Bəyannaməsi ruhunda uğurla inkişaf etdiyini xüsusi vurğuladılar. İmzalanan sənədlər paketinə bərpa olunan enerji mənbələrindən əldə edilən elektrikin Avropaya birgə nəqli, Naxçıvan Muxtar Respublikasının qaz və elektrik təchizatının tam şaxələndirilməsi və Zəngəzur dəhlizinin reallaşdırılması ilə bağlı birgə fəaliyyət planı daxildir.

İclasdan sonra keçirilən birgə mətbuat konfransında qeyd olunub ki, 2026-cı ilin sonunadək ticarət dövriyyəsinin həcmi rekord həddə çatacaq. Eyni zamanda iki ölkənin birgə sənaye zonalarının qurulması və azad edilmiş Qarabağ və Şərqi Zəngəzur bölgələrində həyata keçirilən layihələrə investisiyaların artırılması nəzərdə tutulur.`,
        image_url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
        author: "Tural Məmmədov",
        tags: "Siyasət, Türkiyə, Zirvə, İqtisadiyyat, Enerji",
        is_manshet: 1, // Əsas Böyük Manşet
        is_breaking: 1,
        is_featured: 1,
        views: 14850,
        likes: 342,
        read_time: 4,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        title: "Qarabağda 'Ağıllı Şəhər' layihələri genişlənir: Daha 500 ailə doğma yurduna qayıtdı",
        slug: "qarabagda-agilli-seher-layiheleri-genislenir-500-aile-qayitdi",
        category_id: 3, // Cəmiyyət
        summary: "Böyük Qayıdış proqramı çərçivəsində Laçın və Füzulidə yeni yaşayış massivlərinin açılışı olub, sakinlər müasir ekoloji evlərlə təmin ediliblər.",
        content: `Azərbaycanın işğaldan azad edilmiş ərazilərində Böyük Qayıdış proqramı sürətlə davam etdirilir. Növbəti köç karvanı bu səhər Füzuli və Laçın rayonlarına yola salınıb.

Yeni inşa edilən yaşayış massivləri 'Ağıllı Kənd' və 'Ağıllı Şəhər' konseptləri əsasında qurulub. Bütün evlər günəş panelləri ilə təchiz olunub, mərkəzləşdirilmiş rəqəmsal idarəetmə və optik internet infrastrukturu ilə təmin edilib. 

Sakinlər üçün həmçinin yeni məktəb binaları, uşaq bağçaları, xəstəxanalar və istehsal müəssisələri istifadəyə verilib ki, bu da yeni qayıdan vətəndaşların dayanıqlı iş yerləri ilə təmin olunmasına zəmanət verir.`,
        image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        author: "Sevinc Qasımova",
        tags: "Qarabağ, Böyük Qayıdış, Ağıllı Şəhər, Füzuli, Laçın",
        is_manshet: 2, // Yan manşet 1
        is_breaking: 0,
        is_featured: 1,
        views: 9230,
        likes: 512,
        read_time: 3,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        title: "Neft bazarlarında kəskin bahalaşma: 'Brent' markalı neftin qiyməti 84 dolları ötdü",
        slug: "neft-bazarlarinda-keskin-bahalasma-brent-84-dollari-otdu",
        category_id: 2, // İqtisadiyyat
        summary: "Qlobal bazarlarda tədarük zəncirindəki gərginlik və Asiya ölkələrində sənaye tələbatının artması fonunda xam neft qiymətləri son ayların ən yüksək həddinə çatdı.",
        content: `London ICE birjasında keçirilən hərraclarda Brent markalı neftin bir barelinin qiyməti 84.40 ABŞ dollarına yüksəlib. Analitiklər bu artımı bir neçə qlobal amillə əlaqələndirirlər.

İlk növbədə, OPEK+ ölkələrinin hasilat kvotalarına ciddi riayət etməsi bazarda təklif qıtlığı ehtimalını gücləndirib. İkincisi, iri sənaye mərkəzlərində neft emalı zavodlarının tam güclə işləməsi tələbatı stimullaşdırır.

Ekspertlər bildirirlər ki, neftin qiymətinin yüksək qalması Azərbaycanın tədiyyə balansına və Dövlət Neft Fondunun valyuta aktivlərinə əlavə müsbət təsir göstərəcək.`,
        image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
        author: "Rəşad Əliyev",
        tags: "İqtisadiyyat, Neft, Brent, Birja, Valyuta",
        is_manshet: 2, // Yan manşet 2
        is_breaking: 1,
        is_featured: 1,
        views: 8120,
        likes: 195,
        read_time: 3,
        created_at: new Date(Date.now() - 80 * 60 * 1000).toISOString()
      },
      {
        title: "Şuşada Beynəlxalq Musiqi və Folklor Festivalı təntənə ilə start götürdü",
        slug: "susada-beynelxalq-musiqi-ve-folklor-festivali-start-goturdu",
        category_id: 6, // Mədəniyyət
        summary: "Azərbaycanın mədəniyyət paytaxtında 20-dən artıq ölkənin tanınmış musiqiçiləri və sənət ustaları Cıdır düzündə bir araya gəldi.",
        content: `Azərbaycanın mədəniyyət paytaxtı Şuşa şəhərində möhtəşəm Beynəlxalq Folklor Festivalı təşkil edilib. Festivalın açılış mərasimi əfsanəvi Cıdır düzündə baş tutub.

Tədbirdə UNESCO-nun nümayəndələri, xarici ölkələrin mədəniyyət nazirləri və beynəlxalq səviyyəli sənətkarlar iştirak edirlər. Festival proqramına xalq musiqisi konsertləri, xalçaçılıq və misgərlik sərgiləri, eləcə də gənc ifaçıların müsabiqəsi daxildir.

Şuşa küçələrində qurulan açıq hava səhnələrində ifa olunan Qarabağ şikəstəsi və muğam kompozisiyaları qonaqlar tərəfindən sürəkli alqışlarla qarşılanıb.`,
        image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
        author: "Günel Hüseynova",
        tags: "Mədəniyyət, Şuşa, Festival, Muğam, Cıdır Düzü",
        is_manshet: 2, // Yan manşet 3
        is_breaking: 0,
        is_featured: 1,
        views: 6450,
        likes: 420,
        read_time: 3,
        created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString()
      },
      {
        title: "Süni İntellekt və Rəqəmsal İdarəetmə: Azərbaycanda yeni dövlət platforması istifadəyə verildi",
        slug: "suni-intellekt-ve-reqemsal-idareetme-yeni-dovlet-platformasi",
        category_id: 7, // Texnologiya
        summary: "Vətəndaşların dövlət orqanlarına müraciətlərini saniyələr içində analiz edən və xidmətləri optimallaşdıran milli süni intellekt modeli təqdim olundu.",
        content: `Rəqəmsal İnkişaf və Nəqliyyat Nazirliyi ölkədə elektron dövlət xidmətlərinin səmərəliliyini artırmaq məqsədilə süni intellektlə çalışan yeni platformanın tətbiqinə başlayıb.

Milli dil modelimizə (LLM) əsaslanan sistem vətəndaşların hüquqi, sosial və inzibati sorğularını Azərbaycan dilində tam dərk edərək avtomatik yönləndirir və operativ cavablar hazırlayır.

Platformanın tətbiqi sayəsində sənəd dövriyyəsinin sürəti 4 dəfə artıb, bürokratik gecikmələr isə minimuma endirilib. Layihə növbəti aylarda səhiyyə və təhsil sistemlərinə də inteqrasiya ediləcək.`,
        image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
        author: "Kənan İsmayılov",
        tags: "Texnologiya, Süni İntellekt, Rəqəmsallaşma, İnnovasiya",
        is_manshet: 2, // Yan manşet 4
        is_breaking: 0,
        is_featured: 1,
        views: 11340,
        likes: 678,
        read_time: 4,
        created_at: new Date(Date.now() - 140 * 60 * 1000).toISOString()
      },
      {
        title: "Qarabağ FK Avropa Liqasında növbəti qələbəsini qazandı: Möhtəşəm oyun və 3 xal",
        slug: "qarabag-fk-avropa-liqasinda-novbeti-qelebesini-qazandi",
        category_id: 5, // İdman
        summary: "Tofiq Bəhrəmov adına Respublika stadionunda keçirilən gərgin qarşılaşmada təmsilçimiz rəqibini 2:1 hesabı ilə məğlub edərək qrup liderliyini möhkəmləndirdi.",
        content: `UEFA Avropa Liqasının qrup mərhələsinin mərkəzi qarşılaşmasında Ağdamın 'Qarabağ' klubu öz meydanında Avropanın iddialı komandalarından birini qəbul edib.

Matçın ilk dəqiqələrindən təzyiqi artıran komandamız 23-cü dəqiqədə baxımlı kombinasiya ilə hesabı açıb. İkinci hissədə rəqib fərqi bərabərləşdirsə də, 84-cü dəqiqədə cərimə zərbəsindən vurulan baxımlı qol 'Qarabağ'a vacib 3 xal qazandırıb.

Baş məşqçi Qurban Qurbanov oyundan sonrakı mətbuat konfransında futbolçularının xarakter göstərdiyini və azarkeşlərin möhtəşəm dəstəyinin qələbədə böyük rol oynadığını bildirib.`,
        image_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
        author: "Elvin Babayev",
        tags: "İdman, Qarabağ FK, Futbol, UEFA, Qələbə",
        is_manshet: 0,
        is_breaking: 0,
        is_featured: 1,
        views: 18900,
        likes: 1204,
        read_time: 3,
        created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString()
      },
      {
        title: "Milli Məclisdə yeni büdcə zərfi müzakirəyə çıxarıldı: Sosial xərclər və pensiyalar artırılır",
        slug: "milli-meclisde-yeni-budce-zerfi-sosial-xercler-pensiyalar-artirilir",
        category_id: 1, // Siyasət
        summary: "Gələn ilin dövlət büdcəsi layihəsində sosial təminat, əməkhaqqı və pensiya təminatı üçün ayrılan vəsaitlərin 12% artırılması nəzərdə tutulur.",
        content: `Azərbaycan Respublikası Milli Məclisinin plenar iclasında gələn il üçün dövlət büdcəsi zərfinin birinci oxunuşda müzakirələri başlayıb.

Maliyyə Nazirliyinin təqdim etdiyi sənədə əsasən, büdcənin sosialyönümlü xarakteri qorunub saxlanılıb. Əhalinin həssas qruplarının müdafiəsi, şəhid ailələri və müharibə əlillərinin müavinətlərinin artırılması, eləcə də minimum əməkhaqqının mərhələli yüksəldilməsi üçün xüsusi maliyyə fondu nəzərdə tutulub.

Müzakirələrdə çıxış edən deputatlar büdcə gəlirlərinin qeyri-neft sektoru hesabına təmin olunmasının müsbət dinamikasını qeyd ediblər.`,
        image_url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
        author: "Tural Məmmədov",
        tags: "Siyasət, Milli Məclis, Büdcə, Pensiya, Sosial Təminat",
        is_manshet: 0,
        is_breaking: 0,
        is_featured: 1,
        views: 7420,
        likes: 210,
        read_time: 4,
        created_at: new Date(Date.now() - 210 * 60 * 1000).toISOString()
      },
      {
        title: "ANALİTİKA: Zəngəzur Dəhlizi Avrasiyanın geosiyasi və logistik xəritəsini necə dəyişir?",
        slug: "analitika-zengezur-dehlizi-avrasiyanin-geosiyasi-xeritesini-nece-deyisir",
        category_id: 8, // Analitika
        summary: "Orta Dəhlizin ən strateji həlqəsi olan layihənin iqtisadi rentabelliyi və region dövlətləri üçün yaratdığı misilsiz tranzit üstünlükləri.",
        content: `Qlobal ticarət yollarının yenidən formalaşdığı bir dövrdə Zəngəzur dəhlizi təkcə Cənubi Qafqazın deyil, bütövlükdə Avrasiya qitəsinin ən təhlükəsiz və qısa logistik marşrutuna çevrilir.

Çindən Avropaya yük daşımalarının müddətini dəniz yoluna nisbətən 3 dəfə qısaldan bu marşrut, illik milyardlarla dollar dəyərində ticarət dövriyyəsinə xidmət etmək potensialına malikdir. Azərbaycanın tranzit ölkə kimi mövqeyi möhkəmlənir, eyni zamanda Naxçıvanla birbaşa quru nəqliyyat əlaqəsi təmin olunur.

Ekspertlərin qənaətinə görə, layihənin tam gücü ilə işə düşməsi bölgədə daimi sülh və qarşılıqlı iqtisadi asılılıq mühiti formalaşdıracaq ki, bu da bütün tərəfdaşlar üçün strateji dividend deməkdir.`,
        image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
        author: "Dr. Kamran Quliyev (Ekspert)",
        tags: "Analitika, Zəngəzur Dəhlizi, Orta Dəhliz, Nəqliyyat, Geosiyasət",
        is_manshet: 0,
        is_breaking: 0,
        is_featured: 1,
        views: 12500,
        likes: 890,
        read_time: 6,
        created_at: new Date(Date.now() - 260 * 60 * 1000).toISOString()
      },
      {
        title: "BMT İqlim Zirvəsində Azərbaycanın 'Yaşıl Enerji' təşəbbüsləri yüksək qiymətləndirildi",
        slug: "bmt-iqlim-zirvesinde-azerbaycanin-yasil-enerji-tesebbusleri-qiymetlendirildi",
        category_id: 4, // Dünya
        summary: "Qlobal emissiyaların azaldılması və Xəzər dənizindən Avropaya sualtı yaşıl kabel layihəsi beynəlxalq tərəfdaşlar tərəfindən nümunəvi model kimi təqdim edildi.",
        content: `Birləşmiş Millətlər Təşkilatının İqlim Sammitində çıxış edən beynəlxalq ekspertlər Azərbaycanın alternativ enerji sektorundakı irimiqyaslı layihələrini təqdir ediblər.

Xüsusilə Xəzər dənizinin külək enerjisi potensialından istifadə edərək Qara dənizin dibi ilə Rumıniya və Macarıstana elektrik xəttinin çəkilməsi layihəsi Avropanın enerji təhlükəsizliyinə misilsiz töhfə verir.

Azərbaycan nümayəndə heyəti bəyan edib ki, 2030-cu ilədək ölkənin ümumi enerji balansında bərpa olunan mənbələrin payı 30 faizi ötəcək.`,
        image_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
        author: "Aysel Tağıyeva",
        tags: "Dünya, BMT, Yaşıl Enerji, Ekologiya, İqlim",
        is_manshet: 0,
        is_breaking: 0,
        is_featured: 0,
        views: 4890,
        likes: 177,
        read_time: 3,
        created_at: new Date(Date.now() - 320 * 60 * 1000).toISOString()
      },
      {
        title: "Azərbaycanın yeni peyki orbitə buraxılmağa hazırlanır: 'Azərkosmos'dan rəsmi açıqlama",
        slug: "azerbaycanin-yeni-peyki-orbite-buraxilmaga-hazirlanir",
        category_id: 7, // Texnologiya
        summary: "Yüksək ayırdetmə qabiliyyətinə malik növbəti optik müşahidə peyki kənd təsərrüfatı, xəritəçəkmə və təbii fəlakətlərin monitorinqi sahəsində yeni imkanlar açacaq.",
        content: `Kosmik Agentlik ('Azərkosmos') növbəti nəsil yerüstü müşahidə peykinin orbitə çıxarılması üzrə hazırlıq işlərini yekunlaşdırmaq üzrədir.

Müasir sensorlarla təchiz olunmuş peyk Yer kürəsinin yüksək dəqiqlikli görüntülərini real vaxt rejimində mərkəzə ötürə biləcək. Bu məlumatlar torpaq ehtiyatlarının idarə olunması, su anbarlarının doluluq səviyyəsinin izlənilməsi və meşə yanğınlarının qarşısının alınmasında həlledici rol oynayacaq.

Peykin buraxılışı beynəlxalq kosmodromdan cari ilin sonunda həyata keçiriləcək.`,
        image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
        author: "Kənan İsmayılov",
        tags: "Texnologiya, Kosmos, Azərkosmos, Peyk, Elm",
        is_manshet: 0,
        is_breaking: 0,
        is_featured: 1,
        views: 6300,
        likes: 310,
        read_time: 3,
        created_at: new Date(Date.now() - 380 * 60 * 1000).toISOString()
      },
      {
        title: "MÜSAHİBƏ: 'Azərbaycan kinosunun intibah dövrü başlayır' - Xalq Artisti ilə səmimi söhbət",
        slug: "musahibe-azerbaycan-kinosunun-intibah-dovru-baslayir",
        category_id: 6, // Mədəniyyət
        summary: "Tanınmış rejissor və aktyor yeni çəkilən tarixi filmlər, gənc kinematoqrafçıların uğurları və beynəlxalq festivallarda təmsilçilikdən danışdı.",
        content: `Portalımızın qonağı olan görkəmli kino xadimi Azərbaycan kinosunun bugünkü vəziyyəti və gələcək perspektivləri haqqında maraqlı fikirlərini bölüşüb.

'Bizim tariximiz, xüsusən də son illərdə qazandığımız parlaq zəfər dünya kino sənayesi üçün çox zəngin mənbədir. İndi ən başlıca hədəfimiz filmlərimizi beynəlxalq platformalara və festivallara çıxarmaqdır. Gənclərimizdə çox böyük həvəs və müasir texniki biliklər var,' deyə sənətkar qeyd edib.

Müsahibədə həmçinin Şuşada və Xankəndidə çəkilişləri planlaşdırılan yeni tarixi ekran əsəri haqqında ilk eksklüziv təfərrüatlar açıqlanıb.`,
        image_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
        author: "Günel Hüseynova",
        tags: "Mədəniyyət, Müsahibə, Kino, Teatr, İncəsənət",
        is_manshet: 0,
        is_breaking: 0,
        is_featured: 0,
        views: 5120,
        likes: 240,
        read_time: 5,
        created_at: new Date(Date.now() - 440 * 60 * 1000).toISOString()
      },
      {
        title: "Azərbaycan Ordusunun növbəti komando briqadasında döyüş hazırlığı yoxlanıldı",
        slug: "azerbaycan-ordusunun-komando-briqadasinda-doyus-hazirligi-yoxlanildi",
        category_id: 9, // Hərbi
        summary: "Müdafiə Nazirliyinin rəhbərliyi çətin dağlıq şəraitdə keçirilən taktiki təlimləri izləyib, müasir PUA və artilleriya uzlaşması sınaqdan keçirilib.",
        content: `Müdafiə Nazirliyinin təsdiq etdiyi tədris planına uyğun olaraq, dağlıq ərazilərdə yerləşən Komando hərbi hissələrində intensiv döyüş atışlı taktiki təlimlər icra olunub.

Təlimlərdə şərti düşmən sığınacaqlarının kəşfiyyat dronları vasitəsilə aşkarlanması, dəqiq artilleriya və minaatan zərbələri ilə zərərsizləşdirilməsi tapşırıqları yüksək peşəkarlıqla icra edilib.

Komandirlərin idarəetmə bacarıqları və xüsusi təyinatlıların dözümlülüyü nazirlik rəhbərliyi tərəfindən yüksək qiymətləndirilib.`,
        image_url: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1200&q=80",
        author: "Hərbi Şöbə",
        tags: "Hərbi, Ordu, Komando, Təlim, Müdafiə",
        is_manshet: 0,
        is_breaking: 0,
        is_featured: 1,
        views: 8900,
        likes: 620,
        read_time: 3,
        created_at: new Date(Date.now() - 500 * 60 * 1000).toISOString()
      }
    ];

    for (const art of articles) {
      insertArt.run(
        art.title, art.slug, art.category_id, art.summary, art.content,
        art.image_url, art.author, art.tags, art.is_manshet, art.is_breaking,
        art.is_featured, art.views, art.likes, art.read_time, art.created_at
      );
    }
  }

  // Seed Breaking News
  const brkCount = db.prepare('SELECT COUNT(*) as count FROM breaking_news').get().count;
  if (brkCount === 0) {
    const insertBrk = db.prepare('INSERT INTO breaking_news (title, url, is_active) VALUES (?, ?, ?)');
    insertBrk.run('Azərbaycan və Türkiyə arasında yeni strateji əməkdaşlıq sazişləri imzalandı', '/article.html?id=1', 1);
    insertBrk.run('Neft bazarlarında "Brent" markalı neftin qiyməti 84 dolları ötdü', '/article.html?id=3', 1);
    insertBrk.run('Laçın və Füzuliyə növbəti köç karvanı yola düşdü: 500 ailə doğma yurduna qayıdır', '/article.html?id=2', 1);
    insertBrk.run('Qarabağ FK UEFA Avropa Liqasında qrup liderliyini möhkəmləndirdi', '/article.html?id=6', 1);
  }

  // Seed Daily Poll
  const pollCount = db.prepare('SELECT COUNT(*) as count FROM polls').get().count;
  if (pollCount === 0) {
    const insertPoll = db.prepare('INSERT INTO polls (question, is_active, total_votes) VALUES (?, 1, 1420)');
    const pollResult = insertPoll.run('Sizcə, paytaxtda ictimai nəqliyyatda nağdsız və elektron sistemlərin tətbiqi tıxacların azalmasına necə təsir edir?');
    const pollId = pollResult.lastInsertRowid;

    const insertOpt = db.prepare('INSERT INTO poll_options (poll_id, option_text, votes) VALUES (?, ?, ?)');
    insertOpt.run(pollId, 'Çox müsbət təsir göstərir, gediş-gəliş sürətlənir', 680);
    insertOpt.run(pollId, 'Müəyyən qədər rahatlıq yaradır, amma kifayət deyil', 490);
    insertOpt.run(pollId, 'Əsas problem avtomobil sayının həddən artıq olmasıdır', 210);
    insertOpt.run(pollId, 'Fikrim yoxdur / Neytral', 40);
  }

  // Seed sample comments
  const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
  if (commentCount === 0) {
    const insertComment = db.prepare('INSERT INTO comments (article_id, author_name, content, status) VALUES (?, ?, ?, ?)');
    insertComment.run(1, 'Eldar Babayev', 'Çox qürurverici və tarixi bir hadisədir. İki dövlət bir millət birliyimiz əbədidir!', 'approved');
    insertComment.run(1, 'Nigar Rüstəmova', 'Yaşıl enerji sahəsindəki layihələr ölkəmizi gələcəkdə böyük ixrac mərkəzinə çevirəcək.', 'approved');
    insertComment.run(2, 'Vüsal Məcidov', 'Qarabağımız hər gün daha da gözəlləşir. Sakinlərə xoşbəxt həyat arzulayıram.', 'approved');
    insertComment.run(6, 'Fərid Əhmədli', 'Qarabağ komandası həmişə bizi sevindirir, təbriklər Qurban müəllimə!', 'approved');
  }

  // Seed default settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    insertSetting.run('site_name', 'Günün Nəbzi');
    insertSetting.run('site_slogan', 'Azərbaycanın və Dünyanın Operativ Xəbər Portalı');
    insertSetting.run('contact_email', 'redaksiya@gununnebzi.az');
    insertSetting.run('contact_phone', '+994 (12) 590-00-00');
    insertSetting.run('whatsapp_number', '+994 (50) 999-00-11');
    insertSetting.run('usd_rate', '1.7000');
    insertSetting.run('eur_rate', '1.8480');
    insertSetting.run('rub_rate', '0.0182');
    insertSetting.run('brent_rate', '84.40');
    insertSetting.run('gold_rate', '2745.50');
    insertSetting.run('weather_baku', '21°C');
    insertSetting.run('weather_desc', 'Günəşli, mülayim külək');
  }
}

export default db;
