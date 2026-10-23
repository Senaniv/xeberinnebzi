# 🔴 Günün Nəbzi - Müasir Azərbaycan Xəbər Portalı və İdarəetmə Paneli (CMS)

**"Günün Nəbzi"** —  tam funksional, müasir və yüksək sürətli xəbər portalıdır.

---

## 📋 Saytların Analizi və "Günün Nəbzi" Konsepti

### 1. Oxu.az və Modern.az Saytlarının Müqayisəsi
* **Oxu.az:** Kart əsaslı dinamik UI, böyük foto-manşetlər, operativ "Son Dəqiqə" axını, canlı valyuta və hava vidcetləri, nömrələnmiş "Ən çox oxunanlar" reytinqi.
* **Modern.az:** Publisistik və analitik dərinlik, köşə yazıları, ictimai müsahibələr, "Günün Sorğusu" (interaktiv səsvermə), rəsmi xronika.
* **"Günün Nəbzi" Sintezi:** Oxu.az-ın vizual sürəti və canlı info-vidcetləri ilə Modern.az-ın analitik rubrikalarını, sorğularını və cəmiyyət fokusunu bir araya gətirərək həm operativ, həm də analitik tələblərə cavab verir.

---

## ✨ Əsas Xüsusiyyətlər

### 🌐 Oxucu Portalı (`/`)
1. **İnformasiya Başlığı (Top Info Bar):**
   * Azərbaycan dilində cari tarix və canlı saat (`23 Oktyabr 2026, Cümə | 13:45:00`).
   * Canlı Valyuta Məzənnələri (USD, EUR, RUB, Brent Neft, Qızıl).
   * Bakı və bölgələr üzrə hava durumu.
   * Gecə / Gündüz rejimi açarı (Dark / Light Mode) - yaddaşda saxlanılır.
2. **"Son Dəqiqə" (Breaking News Ticker):**
   * Yanıb-sönən puls animasiyalı qırmızı zolaq, fasiləsiz axan təcili xəbərlər.
3. **Manşet Bölməsi (Hero Grid):**
   * 1 Böyük Dominant Manşet (böyük foto, qradiyent, oxunma və dərc tarixi).
   * 4 Yan Manşet Kartı (2x2 responsiv şəbəkə).
4. **Xronoloji Xəbər Lenti (Son Xəbərlər):**
   * Dəqiqəbədəqiqə yenilənən lent, kateqoriyalar üzrə filtrləmə.
   * "Daha çox göstər" (Pagination / Load more).
5. **Axtarış Sistemi:**
   * Başlıq, xülasə və mətn üzrə ani canlı axtarış (Instant live search).
6. **Yan Panel Vidcetləri (Sidebar):**
   * **Ən Çox Oxunanlar:** 1-dən 7-yə qədər nömrələnmiş trend xəbərlər.
   * **Günün Sorğusu:** Oxucular üçün interaktiv səsvermə və anında faizlərlə nəticələr.
   * **Valyuta Çevirici:** AZN ilə xarici valyutaların anında hesablanması kalkulyatoru.
   * **E-Bülleten:** Gündəlik xəbər xülasəsi üçün abunəlik.
7. **Xüsusi Rubrikalar:**
   * "Analitika & Müsahibələr" bloku.
   * Hərbi, Texnologiya, İdman, Mədəniyyət bölmələri.

---

### 📖 Məqalə Oxuma Təcrübəsi (`/article.html?id=...`)
* **Oxu Alətləri:**
  * **Şrift Ölçüsü Tənzimləyicisi:** `A-`, `A`, `A+` ilə mətni oxucunun istəyinə uyğunlaşdırma.
  * **Səsləndirmə ("Xəbəri Dinlə"):** Web Speech API ilə xəbərin avtomatik oxunması.
  * **Sosial Şəbəkələrdə Paylaş:** WhatsApp, Telegram, Facebook, X (Twitter) və Link Kopyalama (Toast bildirişlə).
  * **Çap Rejimi:** Qəzet formatında səliqəli çap üçün xüsusi CSS qaydaları.
* **Reaksiyalar Barı:** 👍 Maraqlıdır, ❤️ Əla, 😮 Təəccüblü, 😢 Kədərli, 😡 Qəzəbli (Canlı sayğac).
* **Şərhlər Bölməsi:** Oxucu rəylərinin dərhal əlavə olunması və siyahılanması.
* **Oxşar Xəbərlər:** Həmin kateqoriyadan olan 4 tövsiyə olunan xəbər kartı.

---

### 🛠️ Xüsusi Redaksiya İdarəetmə Paneli (`/admin`)
* **İdarə Paneli (Dashboard):**
  * Ümumi statistika: Toplam xəbər, Baxış sayı, Şərhlər, Təcili xəbərlər.
  * Kateqoriyalar üzrə pay vizuallaşdırması.
  * Ən çox oxunan 5 xəbər cədvəli.
  * Ən son şərhlər.
  * Sürətli Təcili Xəbər Lentə atma qutusu.
* **Xəbərlər İdarəsi (CRUD):**
  * Bütün xəbərlərin siyahısı, axtarış, kateqoriya filtri və səhifələmə.
  * Yeni xəbər əlavə et / Redaktə et:
    * Başlıq, Slug avtomatik yaranması.
    * Kateqoriya seçimi, Müəllif, Oxuma müddəti.
    * Qısa xülasə (Lead) və Tam mətn.
    * Əsas şəkil: Kompüterdən fayl yükləmə (`/api/upload`) və ya URL daxil etmə + Önizləmə.
    * Status: "Dərc edilib" / "Qaralama".
    * Nişanlar: "Baş Böyük Manşet", "Yan Manşet", "Təcili Xəbər (Breaking)", "Seçilmiş".
* **Təcili Xəbərlər İdarəsi:**
  * Qırmızı lentə xəbər əlavə et, aktiv/deaktiv et, sil.
* **Kateqoriyalar İdarəsi:**
  * Yeni kateqoriya yarat, rəng palitrasından rəng seç, sil.
* **Şərhlər Moderasiyası:**
  * Oxuculardan gələn rəyləri izlə və lazım gəldikdə sil.
* **Günün Sorğusu İdarəsi:**
  * Yeni sual və variantlar təyin et, keçmiş sorğuları idarə et, aktiv sorğunu dəyiş.
* **Sayt Tənzimləmələri:**
  * Saytın adı, şüarı, əlaqə telefonları, e-poçt və WhatsApp nömrəsi.
  * Valyuta məzənnələri (USD, EUR, RUB, Brent) və Hava durumu.

---


---
