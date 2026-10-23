import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
let db = null;
let isFallback = false;

// Seed dataset constants in memory (shared by both engines)
export const initialCategories = [
  { id: 1, name: 'Siyasət', slug: 'siyaset', color: '#dc2626', icon: 'landmark', sort_order: 1 },
  { id: 2, name: 'İqtisadiyyat', slug: 'iqtisadiyyat', color: '#059669', icon: 'trending-up', sort_order: 2 },
  { id: 3, name: 'Cəmiyyət', slug: 'cemiyyet', color: '#2563eb', icon: 'users', sort_order: 3 },
  { id: 4, name: 'Dünya', slug: 'dunya', color: '#7c3aed', icon: 'globe', sort_order: 4 },
  { id: 5, name: 'İdman', slug: 'idman', color: '#d97706', icon: 'trophy', sort_order: 5 },
  { id: 6, name: 'Mədəniyyət', slug: 'medeniyyet', color: '#db2777', icon: 'palette', sort_order: 6 },
  { id: 7, name: 'Texnologiya', slug: 'texnologiya', color: '#0891b2', icon: 'cpu', sort_order: 7 },
  { id: 8, name: 'Analitika', slug: 'analitika', color: '#4f46e5', icon: 'file-text', sort_order: 8 },
  { id: 9, name: 'Hərbi', slug: 'herbi', color: '#475569', icon: 'shield', sort_order: 9 },
];

export const initialArticles = [
  {
    id: 1,
    title: "Azərbaycan və Qardaş Türkiyə arasında yeni strateji iqtisadi və enerji sazişləri imzalandı",
    slug: "azerbaycan-turkiye-yeni-iqtisadi-ve-enerji-sazisleri-imzalandi",
    category_id: 1,
    summary: "Bakıda keçirilən Yüksək Səviyyəli Əməkdaşlıq Şurasının iclasında iki ölkə arasında yaşıl enerji dəhlizi və ticarət dövriyyəsinin 15 milyard dollara çatdırılması barədə mühüm sənədlər qəbul edildi.",
    content: `Azərbaycan Respublikasının paytaxtı Bakıda keçirilən Yüksək Səviyyəli Strateji Əməkdaşlıq Şurasının növbəti iclasında ikitərəfli əlaqələrin yeni mərhələsinə qədəm qoyuldu.

Görüş zamanı dövlət başçıları qardaş ölkələr arasındakı müttəfiqlik münasibətlərinin Şuşa Bəyannaməsi ruhunda uğurla inkişaf etdiyini xüsusi vurğuladılar. İmzalanan sənədlər paketinə bərpa olunan enerji mənbələrindən əldə edilən elektrikin Avropaya birgə nəqli, Naxçıvan Muxtar Respublikasının qaz və elektrik təchizatının tam şaxələndirilməsi və Zəngəzur dəhlizinin reallaşdırılması ilə bağlı birgə fəaliyyət planı daxildir.

İclasdan sonra keçirilən birgə mətbuat konfransında qeyd olunub ki, 2026-cı ilin sonunadək ticarət dövriyyəsinin həcmi rekord həddə çatacaq. Eyni zamanda iki ölkənin birgə sənaye zonalarının qurulması və azad edilmiş Qarabağ və Şərqi Zəngəzur bölgələrində həyata keçirilən layihələrə investisiyaların artırılması nəzərdə tutulur.`,
    image_url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    author: "Tural Məmmədov",
    tags: "Siyasət, Türkiyə, Zirvə, İqtisadiyyat, Enerji",
    is_manshet: 1,
    is_breaking: 1,
    is_featured: 1,
    views: 14850,
    likes: 342,
    read_time: 4,
    status: 'published',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    title: "Qarabağda 'Ağıllı Şəhər' layihələri genişlənir: Daha 500 ailə doğma yurduna qayıtdı",
    slug: "qarabagda-agilli-seher-layiheleri-genislenir-500-aile-qayitdi",
    category_id: 3,
    summary: "Böyük Qayıdış proqramı çərçivəsində Laçın və Füzulidə yeni yaşayış massivlərinin açılışı olub, sakinlər müasir ekoloji evlərlə təmin ediliblər.",
    content: `Azərbaycanın işğaldan azad edilmiş ərazilərində Böyük Qayıdış proqramı sürətlə davam etdirilir. Növbəti köç karvanı bu səhər Füzuli və Laçın rayonlarına yola salınıb.

Yeni inşa edilən yaşayış massivləri 'Ağıllı Kənd' və 'Ağıllı Şəhər' konseptləri əsasında qurulub. Bütün evlər günəş panelləri ilə təchiz olunub, mərkəzləşdirilmiş rəqəmsal idarəetmə və optik internet infrastrukturu ilə təmin edilib. 

Sakinlər üçün həmçinin yeni məktəb binaları, uşaq bağçaları, xəstəxanalar və istehsal müəssisələri istifadəyə verilib ki, bu da yeni qayıdan vətəndaşların dayanıqlı iş yerləri ilə təmin olunmasına zəmanət verir.`,
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    author: "Sevinc Qasımova",
    tags: "Qarabağ, Böyük Qayıdış, Ağıllı Şəhər, Füzuli, Laçın",
    is_manshet: 2,
    is_breaking: 0,
    is_featured: 1,
    views: 9230,
    likes: 512,
    read_time: 3,
    status: 'published',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    title: "Neft bazarlarında kəskin bahalaşma: 'Brent' markalı neftin qiyməti 84 dolları ötdü",
    slug: "neft-bazarlarinda-keskin-bahalasma-brent-84-dollari-otdu",
    category_id: 2,
    summary: "Qlobal bazarlarda tədarük zəncirindəki gərginlik və Asiya ölkələrində sənaye tələbatının artması fonunda xam neft qiymətləri son ayların ən yüksək həddinə çatdı.",
    content: `London ICE birjasında keçirilən hərraclarda Brent markalı neftin bir barelinin qiyməti 84.40 ABŞ dollarına yüksəlib. Analitiklər bu artımı bir neçə qlobal amillə əlaqələndirirlər.

İlk növbədə, OPEK+ ölkələrinin hasilat kvotalarına ciddi riayət etməsi bazarda təklif qıtlığı ehtimalını gücləndirib. İkincisi, iri sənaye mərkəzlərində neft emalı zavodlarının tam güclə işləməsi tələbatı stimullaşdırır.

Ekspertlər bildirirlər ki, neftin qiymətinin yüksək qalması Azərbaycanın tədiyyə balansına və Dövlət Neft Fondunun valyuta aktivlərinə əlavə müsbət təsir göstərəcək.`,
    image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    author: "Rəşad Əliyev",
    tags: "İqtisadiyyat, Neft, Brent, Birja, Valyuta",
    is_manshet: 2,
    is_breaking: 1,
    is_featured: 1,
    views: 8120,
    likes: 195,
    read_time: 3,
    status: 'published',
    created_at: new Date(Date.now() - 80 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    title: "Şuşada Beynəlxalq Musiqi və Folklor Festivalı təntənə ilə start götürdü",
    slug: "susada-beynelxalq-musiqi-ve-folklor-festivali-start-goturdu",
    category_id: 6,
    summary: "Azərbaycanın mədəniyyət paytaxtında 20-dən artıq ölkənin tanınmış musiqiçiləri və sənət ustaları Cıdır düzündə bir araya gəldi.",
    content: `Azərbaycanın mədəniyyət paytaxtı Şuşa şəhərində möhtəşəm Beynəlxalq Folklor Festivalı təşkil edilib. Festivalın açılış mərasimi əfsanəvi Cıdır düzündə baş tutub.

Tədbirdə UNESCO-nun nümayəndələri, xarici ölkələrin mədəniyyət nazirləri və beynəlxalq səviyyəli sənətkarlar iştirak edirlər. Festival proqramına xalq musiqisi konsertləri, xalçaçılıq və misgərlik sərgiləri, eləcə də gənc ifaçıların müsabiqəsi daxildir.

Şuşa küçələrində qurulan açıq hava səhnələrində ifa olunan Qarabağ şikəstəsi və muğam kompozisiyaları qonaqlar tərəfindən sürəkli alqışlarla qarşılanıb.`,
    image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    author: "Günel Hüseynova",
    tags: "Mədəniyyət, Şuşa, Festival, Muğam, Cıdır Düzü",
    is_manshet: 2,
    is_breaking: 0,
    is_featured: 1,
    views: 6450,
    likes: 420,
    read_time: 3,
    status: 'published',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    title: "Süni İntellekt və Rəqəmsal İdarəetmə: Azərbaycanda yeni dövlət platforması istifadəyə verildi",
    slug: "suni-intellekt-ve-reqemsal-idareetme-yeni-dovlet-platformasi",
    category_id: 7,
    summary: "Vətəndaşların dövlət orqanlarına müraciətlərini saniyələr içində analiz edən və xidmətləri optimallaşdıran milli süni intellekt modeli təqdim olundu.",
    content: `Rəqəmsal İnkişaf və Nəqliyyat Nazirliyi ölkədə elektron dövlət xidmətlərinin səmərəliliyini artırmaq məqsədilə süni intellektlə çalışan yeni platformanın tətbiqinə başlayıb.

Milli dil modelimizə (LLM) əsaslanan sistem vətəndaşların hüquqi, sosial və inzibati sorğularını Azərbaycan dilində tam dərk edərək avtomatik yönləndirir və operativ cavablar hazırlayır.

Platformanın tətbiqi sayəsində sənəd dövriyyəsinin sürəti 4 dəfə artıb, bürokratik gecikmələr isə minimuma endirilib. Layihə növbəti aylarda səhiyyə və təhsil sistemlərinə də inteqrasiya ediləcək.`,
    image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    author: "Kənan İsmayılov",
    tags: "Texnologiya, Süni İntellekt, Rəqəmsallaşma, İnnovasiya",
    is_manshet: 2,
    is_breaking: 0,
    is_featured: 1,
    views: 11340,
    likes: 678,
    read_time: 4,
    status: 'published',
    created_at: new Date(Date.now() - 140 * 60 * 1000).toISOString()
  },
  {
    id: 6,
    title: "Qarabağ FK Avropa Liqasında növbəti qələbəsini qazandı: Möhtəşəm oyun və 3 xal",
    slug: "qarabag-fk-avropa-liqasinda-novbeti-qelebesini-qazandi",
    category_id: 5,
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
    status: 'published',
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString()
  },
  {
    id: 7,
    title: "Milli Məclisdə yeni büdcə zərfi müzakirəyə çıxarıldı: Sosial xərclər və pensiyalar artırılır",
    slug: "milli-meclisde-yeni-budce-zerfi-sosial-xercler-pensiyalar-artirilir",
    category_id: 1,
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
    status: 'published',
    created_at: new Date(Date.now() - 210 * 60 * 1000).toISOString()
  },
  {
    id: 8,
    title: "ANALİTİKA: Zəngəzur Dəhlizi Avrasiyanın geosiyasi və logistik xəritəsini necə dəyişir?",
    slug: "analitika-zengezur-dehlizi-avrasiyanin-geosiyasi-xeritesini-nece-deyisir",
    category_id: 8,
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
    status: 'published',
    created_at: new Date(Date.now() - 260 * 60 * 1000).toISOString()
  }
];

export const initialBreaking = [
  { id: 1, title: 'Azərbaycan və Türkiyə arasında yeni strateji əməkdaşlıq sazişləri imzalandı', url: '/article.html?id=1', is_active: 1 },
  { id: 2, title: 'Neft bazarlarında "Brent" markalı neftin qiyməti 84 dolları ötdü', url: '/article.html?id=3', is_active: 1 },
  { id: 3, title: 'Laçın və Füzuliyə növbəti köç karvanı yola düşdü: 500 ailə doğma yurduna qayıdır', url: '/article.html?id=2', is_active: 1 },
  { id: 4, title: 'Qarabağ FK UEFA Avropa Liqasında qrup liderliyini möhkəmləndirdi', url: '/article.html?id=6', is_active: 1 },
];

export const initialPoll = {
  id: 1,
  question: 'Sizcə, paytaxtda ictimai nəqliyyatda nağdsız və elektron sistemlərin tətbiqi tıxacların azalmasına necə təsir edir?',
  is_active: 1,
  total_votes: 1420,
  options: [
    { id: 1, poll_id: 1, option_text: 'Çox müsbət təsir göstərir, gediş-gəliş sürətlənir', votes: 680 },
    { id: 2, poll_id: 1, option_text: 'Müəyyən qədər rahatlıq yaradır, amma kifayət deyil', votes: 490 },
    { id: 3, poll_id: 1, option_text: 'Əsas problem avtomobil sayının həddən artıq olmasıdır', votes: 210 },
    { id: 4, poll_id: 1, option_text: 'Fikrim yoxdur / Neytral', votes: 40 },
  ]
};

export const initialSettings = {
  site_name: 'Günün Nəbzi',
  site_slogan: 'Azərbaycanın və Dünyanın Operativ Xəbər Portalı',
  contact_email: 'redaksiya@gununnebzi.az',
  contact_phone: '+994 (12) 590-00-00',
  whatsapp_number: '+994 (50) 999-00-11',
  usd_rate: '1.7000',
  eur_rate: '1.8480',
  rub_rate: '0.0182',
  brent_rate: '84.40',
  gold_rate: '2745.50',
  weather_baku: '21°C',
  weather_desc: 'Bakı, Günəşli'
};

// Pure in-memory fallback store
class InMemoryStore {
  constructor() {
    this.categories = JSON.parse(JSON.stringify(initialCategories));
    this.articles = JSON.parse(JSON.stringify(initialArticles));
    this.breaking = JSON.parse(JSON.stringify(initialBreaking));
    this.polls = [JSON.parse(JSON.stringify(initialPoll))];
    this.comments = [
      { id: 1, article_id: 1, author_name: 'Eldar Babayev', content: 'Çox qürurverici və tarixi bir hadisədir. İki dövlət bir millət birliyimiz əbədidir!', status: 'approved', created_at: new Date().toISOString() },
      { id: 2, article_id: 1, author_name: 'Nigar Rüstəmova', content: 'Yaşıl enerji sahəsindəki layihələr ölkəmizi gələcəkdə böyük ixrac mərkəzinə çevirəcək.', status: 'approved', created_at: new Date().toISOString() }
    ];
    this.reactions = [];
    this.settings = { ...initialSettings };
  }

  pragma() {}
  exec() {}
  transaction(fn) {
    return fn;
  }

  prepare(sql) {
    const s = sql.toLowerCase().trim();
    const self = this;

    return {
      all(...params) {
        if (s.includes('from categories')) {
          return self.categories.map(c => ({
            ...c,
            article_count: self.articles.filter(a => a.category_id === c.id && a.status === 'published').length
          }));
        }

        if (s.includes('from articles') && s.includes('reactions')) {
          const artId = params[0];
          return self.reactions.filter(r => r.article_id === artId);
        }

        if (s.includes('from reactions')) {
          const artId = params[0];
          return self.reactions.filter(r => r.article_id === artId);
        }

        if (s.includes('from comments') && !s.includes('from articles')) {
          if (params.length > 0 && typeof params[0] === 'number') {
            return self.comments.filter(c => c.article_id === params[0] && c.status === 'approved');
          }
          return self.comments;
        }

        if (s.includes('from breaking_news')) {
          if (s.includes('is_active = 1')) {
            return self.breaking.filter(b => b.is_active === 1);
          }
          return self.breaking;
        }

        if (s.includes('from poll_options')) {
          const pollId = params[0];
          const poll = self.polls.find(p => p.id === pollId) || self.polls[0];
          return poll ? poll.options : [];
        }

        if (s.includes('from polls')) {
          return self.polls;
        }

        if (s.includes('from settings')) {
          return Object.entries(self.settings).map(([key, value]) => ({ key, value }));
        }

        // Default: Articles query
        if (s.includes('from articles')) {
          let list = [...self.articles];

          // Related news query check
          if (s.includes('where a.id !=')) {
            const currentId = params[0];
            return list.filter(a => a.id !== currentId).slice(0, 4).map(a => self.enrichArticle(a));
          }

          if (s.includes('a.category_id = ?')) {
            const catId = params.find(p => typeof p === 'number');
            if (catId) list = list.filter(a => a.category_id === catId);
          } else if (s.includes('c.slug = ?')) {
            const slug = params.find(p => typeof p === 'string' && !p.startsWith('%'));
            if (slug) {
              const cat = self.categories.find(c => c.slug === slug);
              if (cat) list = list.filter(a => a.category_id === cat.id);
            }
          }

          if (s.includes('a.is_manshet = ?')) {
            const m = params.find(p => typeof p === 'number');
            if (m !== undefined) list = list.filter(a => a.is_manshet === m);
          }

          if (s.includes('order by a.views desc')) {
            list.sort((a, b) => b.views - a.views);
          } else {
            list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }

          // Check limit / offset
          const limit = params[params.length - 2];
          const offset = params[params.length - 1];
          if (typeof limit === 'number' && typeof offset === 'number') {
            list = list.slice(offset, offset + limit);
          }

          return list.map(a => self.enrichArticle(a));
        }

        return [];
      },

      get(...params) {
        if (s.includes('count(*)')) {
          if (s.includes('from articles')) {
            return { count: self.articles.length };
          }
          if (s.includes('from categories')) {
            return { count: self.categories.length };
          }
          if (s.includes('from comments')) {
            return { count: self.comments.length };
          }
          if (s.includes('from breaking_news')) {
            return { count: self.breaking.filter(b => b.is_active === 1).length };
          }
        }

        if (s.includes('sum(views)')) {
          return { count: self.articles.reduce((acc, a) => acc + (a.views || 0), 0) };
        }

        if (s.includes('from articles where a.slug = ?') || s.includes('where a.slug = ?')) {
          const slug = params[0];
          const art = self.articles.find(a => a.slug === slug);
          return art ? self.enrichArticle(art) : null;
        }

        if (s.includes('from articles where a.id = ?') || s.includes('where a.id = ?')) {
          const id = parseInt(params[0]);
          const art = self.articles.find(a => a.id === id);
          return art ? self.enrichArticle(art) : null;
        }

        if (s.includes('from polls where is_active = 1')) {
          return self.polls.find(p => p.is_active === 1) || self.polls[0] || null;
        }

        if (s.includes('from polls where id = ?')) {
          const id = params[0];
          return self.polls.find(p => p.id === id) || null;
        }

        if (s.includes('from poll_options where id = ?')) {
          const optId = params[0];
          for (const p of self.polls) {
            const found = p.options.find(o => o.id === optId);
            if (found) return found;
          }
          return null;
        }

        if (s.includes('from categories where slug = ?')) {
          return self.categories.find(c => c.slug === params[0]) || null;
        }

        if (s.includes('from categories where id = ?')) {
          return self.categories.find(c => c.id === parseInt(params[0])) || null;
        }

        return null;
      },

      run(...params) {
        if (s.includes('update articles set views = views + 1')) {
          const id = params[0];
          const art = self.articles.find(a => a.id === id);
          if (art) art.views = (art.views || 0) + 1;
          return { changes: 1 };
        }

        if (s.includes('insert into articles')) {
          const newId = self.articles.length > 0 ? Math.max(...self.articles.map(a => a.id)) + 1 : 1;
          const [title, slug, category_id, summary, content, image_url, author, tags, is_manshet, is_breaking, is_featured, read_time, status] = params;
          self.articles.unshift({
            id: newId,
            title,
            slug,
            category_id,
            summary,
            content,
            image_url,
            author,
            tags,
            is_manshet,
            is_breaking,
            is_featured,
            views: 1,
            likes: 0,
            read_time,
            status,
            created_at: new Date().toISOString()
          });
          return { lastInsertRowid: newId, changes: 1 };
        }

        if (s.includes('delete from articles where id = ?')) {
          const id = params[0];
          self.articles = self.articles.filter(a => a.id !== id);
          return { changes: 1 };
        }

        if (s.includes('insert into comments')) {
          const newId = self.comments.length + 1;
          const [article_id, author_name, content] = params;
          const comment = { id: newId, article_id, author_name, content, status: 'approved', created_at: new Date().toISOString() };
          self.comments.unshift(comment);
          return { lastInsertRowid: newId, changes: 1 };
        }

        if (s.includes('insert into reactions')) {
          const [article_id, reaction_type] = params;
          let r = self.reactions.find(item => item.article_id === article_id && item.reaction_type === reaction_type);
          if (r) {
            r.count += 1;
          } else {
            self.reactions.push({ article_id, reaction_type, count: 1 });
          }
          return { changes: 1 };
        }

        if (s.includes('update poll_options set votes = votes + 1')) {
          const optId = params[0];
          for (const p of self.polls) {
            const found = p.options.find(o => o.id === optId);
            if (found) {
              found.votes += 1;
              p.total_votes = (p.total_votes || 0) + 1;
              break;
            }
          }
          return { changes: 1 };
        }

        if (s.includes('insert into settings')) {
          const [key, value] = params;
          self.settings[key] = value;
          return { changes: 1 };
        }

        return { changes: 1, lastInsertRowid: 1 };
      }
    };
  }

  enrichArticle(art) {
    const cat = this.categories.find(c => c.id === art.category_id);
    const comment_count = this.comments.filter(c => c.article_id === art.id && c.status === 'approved').length;
    return {
      ...art,
      category_name: cat ? cat.name : 'Gündəm',
      category_slug: cat ? cat.slug : 'gundem',
      category_color: cat ? cat.color : '#dc2626',
      comment_count
    };
  }
}

// In Node ES module top-level:
if (isVercel) {
  db = new InMemoryStore();
} else {
  try {
    const pkg = ['better', 'sqlite3'].join('-');
    const { default: Database } = await import(pkg);
    const dbPath = path.join(__dirname, 'database.sqlite');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  } catch (err) {
    db = new InMemoryStore();
  }
}

export function initDatabase() {
  // If it's a real SQLite instance, initialize tables
  if (typeof db.exec === 'function' && db.constructor.name !== 'InMemoryStore') {
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
        is_manshet INTEGER DEFAULT 0,
        is_breaking INTEGER DEFAULT 0,
        is_featured INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        read_time INTEGER DEFAULT 3,
        status TEXT DEFAULT 'published',
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
        status TEXT DEFAULT 'approved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        reaction_type TEXT NOT NULL,
        count INTEGER DEFAULT 0,
        UNIQUE(article_id, reaction_type),
        FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }
}

export default db;
