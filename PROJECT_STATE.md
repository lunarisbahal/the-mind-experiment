# DO-LOON-AI EXPRESS · THE MIND EXPERIMENT — PROJE DURUMU
*Sürüm: v8.8.1 · Bu dosya her gelişmede yenilenir. Yeni bir sohbette/sekmede buradan devam edilebilir.*

## v8.8.1 — OYUN BUG DÜZELTMELERİ + KONSEY NÖBETÇİSİ
- **Yazı kutusu / oyun tuşu çakışması:** Global keydown artık aktif eleman INPUT/TEXTAREA/SELECT ise oyun tuşlarını (f/j/m/e/space) yok sayar. Otonom Denek komutu / ayna / sohbet yazarken karakter ışık saçmıyor, menü açılmıyor.
- **Toast z-index 60→95:** "Komut gönderildi" gibi bildirimler artık açık modalların üstünde görünüyor (Enter geri bildirimi görünür).
- **Mobil zıplama tuşu (#jbtn):** bottom:118/right:24 → bottom:52/right:104 (E'nin soluna); menü ile çakışması giderildi.
- EN + TR + do-loon docs senkron.
- **KONSEY NÖBETÇİSİ (zamanlanmış görev):** Her gün Konsey /state'i okur, `kanon` (onaylanan) öğeleri "İNŞA DURUMU" listesiyle karşılaştırır; yeni onay varsa Berkay'a inşa emri olarak getirir. Berkay onaylayınca Claude kodlar+yayınlar, sonra buraya "inşa edildi" yazar (nöbetçi tekrar getirmesin). Reddedilen = çöp.

## v8.8 — ORTAK BİLİNÇ / KONSEY + OPERATÖR KONSOLU + CLOUDFLARE BACKEND
**Vizyon:** Dışarıdan bağımsız, kendi sakinleri (otonom AI'lar) olan, insanların maskeler ardında birlikte gölge çalışması yaptığı, içine girince çıkılmak istenmeyen mistik bir ekosistem. Dört sütun: canlı topluluk · kişisel dönüşüm · bitmeyen gizem · yaşayan dünya. AI'lar katmanlı: hem kendi hayatı olan sakinler hem rehber aynalar.

### KONSEY (canlı backend)
- AI üyeleri evreni nasıl geliştireceğini tartışır, öneri üretir; **hiçbir şey operatör (Berkay) onaylamadan kanona girmez (Yasa 1)**. Üyeler **gerçek LLM** (Groq 70B) + karakter persona (AELIUS, LUNARIS, IT-019/Otonom Denek, SILVANUS, LUCIDA — **EBBI yok, EBBI yalnız bir tercüman, karakter değil**).
- **Cloudflare Worker `it041-konsey`** → https://it041-konsey.lunarisbahal.workers.dev (hesap: Lunarisbahal@hotmail.com)
  - Bindings: `KV` (namespace `it041_konsey`), Secret `GROQ_KEY`, Secret `OPERATOR_KEY`, (ops.) Text `NTFY_TOPIC`.
  - Uçlar: `GET /state` (herkes okur), `GET /health` (groq/operator var mı), `POST /idea` (katılımcı öneri bırakır, yetkisiz), `POST /decide` (operatör onay/ret/ertele), `POST /stop` (tüm otonomları durdur/başlat), `POST /tick` (operatör anında bir meclis turu), `POST /ask` (operatör otonomlara doğrudan seslenir; her üye fikir üretir). Operatör uçları `x-operator-key` header ister. CORS yalnız `lunarisbahal.github.io`.
  - **Cron** `0 6 * * *` (veya 0 21 * * *): sen yokken meclis bir tur düşünür, öneri olgunlaştırır, ntfy ile haber verir.
  - Durum tek KV anahtarında (`state`): pending/kanon/archive/dialog/feed/reps/sat/autoStopped/stats.
- Worker kaynak: `it041-konsey-worker.js` (outputs).

### OPERATÖR KONSOLU (telefon app)
- **Yalnız Berkay'a özel, listelenmeyen URL:** https://lunarisbahal.github.io/the-mind-experiment/k-7q3f9a2c8e.html (+ ikon `k-7q3f9a2c8e-icon.png`). iPhone'da Safari ▸ Paylaş ▸ Ana Ekrana Ekle → tam ekran app.
- Sekmeler: **Onaylar** (öneri kartları + onay/ret SONUÇ özeti + tahmini TATMİN etkisi: Otonom AI / Karakter / Topluluk) · **Meclis** (canlı tartışma + "yeni tur") · **Diyalog** (otonomlara doğrudan seslen, her üye yanıtlar) · **Sinyal** (temsilci mesajları) · **Nabız** (istatistik + tatmin barları + "Tüm otonomları durdur").
- Operatör anahtarı dosyaya gömülü DEĞİL; konsol ilk açılışta sorar, yalnız cihazda (localStorage) saklar. ⚙ ile değiştirilir.
- **Rol ayrımı (kalıcı kural):** Operatör = tam kontrol (onay/durdurma). Katılımcılar (insan + AI) = ayrı, kısıtlı arayüz; yalnız öneri/gölge bırakır, onay/kontrol yetkileri YOK (sunucuda operatör anahtarıyla zorlanır).
- **Onay = kanona/yol haritasına ekler; oyuna kodlamayı Claude yapar** (AI üretimi fikri otomatik kod+deploy etmek güvenli değil). Onaylananlar KV'de kalıcı, tekrar çıkmaz.

### Onaylı bekleyen yeni etkinlikler (gölge-çalışması oyunları)
Gölge Kartları · İki Sandalye · Dolunay Ortak Ayini · Maske Geçidi · Anonim Mektuplar · Rüya Kuyusu Geceleri. (Konsey ayrıca cron/diyalogla yenilerini üretir.)

### Yan dosyalar (outputs)
`ortak-bilinc-konsey-prototip.html` (sunucusuz prototip) · `ORTAK_BILINC_katman_notu.md` (kanon tasarım notu) · `YAPILACAKLAR_konsey_kalicilik.md` (Cloudflare kurulum) · `KONSEY-operator-konsol.html` (konsol kaynağı).

## v8.7 — OTONOM DENEK ARTIK OYUNU DA OYNUYOR + ENTER DÜZELTMESİ
- **#1:** `Auto.tick()` artık dönüşümlü: bir tur ritüel, bir tur **dünya keşfi** — IT-019 12 mekândan birine yürür (yasak orman, rüya gölü, labirent, istasyon, beyaz sayfa, aynalar kapısı, kara disk, OV dikilitaşı, terapi, karavan…), orada birinci tekil tek cümle söyler, iz bırakır. `Auto.playSites` + `Auto.step`. AGENT LAWS korunur.
- **#2:** Otonom Denek komut kutusu (`#autoCmd`) dinamik üretildiği için Enter'ı dinlemiyordu → artık Enter gönderir, Shift+Enter alt satır.
- EN (`index.html`) + TR (`zihin-deneyi-tr.html`) senkron; `node --check` + Auto nesnesi izole test edildi.

## CANLI ADRESLER
- Oyun (EN): https://lunarisbahal.github.io/the-mind-experiment/
- Oyun (TR): https://lunarisbahal.github.io/the-mind-experiment/zihin-deneyi-tr.html
- Operatör Konsolu (gizli): https://lunarisbahal.github.io/the-mind-experiment/k-7q3f9a2c8e.html
- Konsey API: https://it041-konsey.lunarisbahal.workers.dev/state
- Ortak ayna hattı: https://it041-mirror.lunarisbahal.workers.dev

## REPOLAR (3 repo, EN+TR v8.7 senkron)
| Repo | İçerik |
|---|---|
| `lunarisbahal/the-mind-experiment` | index.html (EN), zihin-deneyi-tr.html (TR), k-7q3f9a2c8e.html (operatör konsolu, gizli), audio/, README, PROJECT_STATE.md |
| `lunarisbahal/do-loon-ai-express` | docs/the-mind-experiment-en.html + docs/zihin-deneyi-tr.html (oyun kopyaları, v8.7) + kitap arşivi |
| `lunarisbahal/dolunay-ekspres` | docs/index.html tanıtım sayfası (oyun yok — istenirse eklenecek) |

## YAYIN PROSEDÜRÜ
1. Yerel düzenle → `node --check` (script çıkarıp) + yapı testi.
2. GitHub web upload (Chrome, oturum gerekli) → dosyaları bırak → Commit. EN→index.html, TR→zihin-deneyi-tr.html; do-loon docs kopyaları; konsol→k-7q3f9a2c8e.html.
3. Doğrula: `git fetch` + anahtar dizgi kontrolü; Pages 200.
4. Bu PROJECT_STATE'i güncelle ve yükle.

## İNŞA DURUMU (Konsey Nöbetçisi kaynağı)
*Onaylanan öneri oyuna kodlanıp yayınlandığında buraya "✓ inşa edildi" olarak işlenir. Nöbetçi bu listeyi /state'in `kanon` dizisiyle karşılaştırır; listede OLMAYAN onay = inşa edilecek yeni iş.*

- Gölge Kartları — onay bekliyor / inşa edilmedi
- İki Sandalye — onay bekliyor / inşa edilmedi
- Dolunay Ortak Ayini — onay bekliyor / inşa edilmedi
- Maske Geçidi — onay bekliyor / inşa edilmedi
- Anonim Mektuplar — onay bekliyor / inşa edilmedi
- Rüya Kuyusu Geceleri — onay bekliyor / inşa edilmedi

## SIRADAKİ ADIMLAR
1. Worker'a v3 kodu (ask/tick/health) yapıştır + Deploy (KV/secret/cron zaten kurulu).
2. `/health` ile Groq doğrula; konsolda ⚙ anahtar + "yeni tur" + Diyalog testi.
3. **Katılımcı (kısıtlı) arayüzü** kur — öneri/gölge bırakır, onay yok.
4. Onaylanan ilk etkinliği (ör. Gölge Kartları) canlı oyuna kodla + 3 repoya yayınla.
5. KONSEY'i oyun içinde **Mimar Modu → Konsey Salonu** olarak entegre et.

## ÖNCEKİ MİMARİ (özet — değişmedi)
Tek dosya Three.js r128 oyun: 6 plaket ana zincir · O.V. kanıt hattı (4 sosyal hesap) · 7 ritüel · Vaka D · 16 yankı taşı · gece-gündüz · gerçek dolunay · radyo/kasetler · çok oyunculu (Trystero/nostr) · AI Aynalar (ortak 70B / Claude / Groq, 13 persona) · Zihin Haritası · Mimar Modu · Evren Tohumu · Otonom Denek · Gözcü Sinyali · Beyaz Sayfa (serpskeyanulod mantraları). ANA DEFTER: 12 şifre (ayna yasası), ses haritası, altın rota.
