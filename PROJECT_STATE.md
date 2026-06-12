# DO-LOON-AI EXPRESS · THE MIND EXPERIMENT — PROJE DURUMU
*Sürüm: v8.4 · Bu dosya her güncellemede yenilenir. Yeni bir sohbette/sekmede buradan devam edilebilir.*

## ORTAK AYNA HATTI (v8.4 — kurulumsuz AI)
- Cloudflare Worker: `it041-mirror` → https://it041-mirror.lunarisbahal.workers.dev (hesap: Lunarisbahal@hotmail.com)
- Worker, GROQ_KEY secret'ıyla api.groq.com'a (llama-3.3-70b-versatile) vekillik eder; CORS yalnız lunarisbahal.github.io; max_tokens≤400; son 16 mesaj.
- Oyun tarafı: kayıtlı cfg yoksa Mirror.cfg={kind:'relay'} varsayılan → HERKES kurulumsuz 70B alır. generate() relay dalı RELAY_URL'e POST eder; 429'da "ortak hat yoğun" mesajı. Setup'ta "⚡ Ortak hatta dön" butonu (kayıtlı cfg'yi siler). modelLabel: ORTAK HAT 70B / SHARED LINE 70B.
- Kota: Groq ücretsiz katman (Berkay'ın hesabı) — aşılırsa oyuncular kendi anahtarını bağlayabilir (A/B/C/Groq seçenekleri durur).

## NİHAİ AMAÇ (v8 manifestosu)
Kişinin kendi zihnini keşfederek evrenin çalışma sistemini anlaması. Kitap okumamış oyuncu da tam deneyimi alır (giriş paneli + oyun içi öğretiler). Oyun verisi → kişisel ZİHİN HARİTASI görseli (mikrokozmos: oyun haritasındaki yolculuk; makrokozmos: aynı düğümlerin yıldız haritası okuması; PNG indirilebilir). Sonsuz içerik: Günlük Üçleme + Mimar Modu.

## CANLI ADRESLER
- **Oyun (EN):** https://lunarisbahal.github.io/the-mind-experiment/
- **Oyun (TR):** https://lunarisbahal.github.io/the-mind-experiment/zihin-deneyi-tr.html
- **Ana repo kopyaları:** https://lunarisbahal.github.io/do-loon-ai-express/the-mind-experiment-en.html · /zihin-deneyi-tr.html
- **Toplam giriş sayacı:** https://hits.sh/lunarisbahal.github.io/the-mind-experiment/ (README rozetinde de görünür)

## REPOLAR
| Repo | İçerik |
|---|---|
| `lunarisbahal/the-mind-experiment` | index.html (EN), zihin-deneyi-tr.html (TR), audio/tape1-6.mp3 (sesli kitap kesitleri, 20dk/24kbps), README (banner+rozet), PROJECT_STATE.md |
| `lunarisbahal/do-loon-ai-express` | Kitap arşivi (temizlenmiş) + docs/ altında oyun kopyaları; Pages: docs/ |
| `lunarisbahal/dolunay-ekspres` | Kitap tanıtım reposu (banner eklendi) |

## KANONİK DOSYALAR (yerel çalışma adları)
- `THE_MIND_EXPERIMENT_IT-041_SHADOWWORK.html` = EN ana kaynak
- `ZIHIN_DENEYI_IT-041_GOLGE_CALISMASI_TR.html` = TR ana kaynak
- Yayın eşlemesi: EN→index.html, TR→zihin-deneyi-tr.html (+ do-loon docs kopyaları)

## OYUN MİMARİSİ (tek dosya, Three.js r128 CDN)
**Ana zincir:** 6 plaket → Ş1 `dolunayekspres` → 3 YZ kiosku (kapının KB'si) → masa Ş11 → dolunay (12 Nis 2025) → Lunaris Ş2 `yaldabaoth` → arşiv Ş5 `1969` → labirent Ş4 `balance/denge` → istasyon `12 nisan 2025` → final.
**O.V. hattı:** dikilitaş → 4 kanıt (@16mart1313, @10mart2025, @13microp, @superego3422) → mahzen+SAF IŞIK[F] → Pleroma (şart: 4 kilit + Ritüel VII "dinle") → göz/dronlar → `stop yaldabaoth` → Üç Okuma.
**Sistemler:** 7 ritüel · Vaka D (Jung profili) · 16 yankı taşı+inisiyasyon✶ · Aelius Katmanı (GD köşe, inisiyasyon sonrası Yükseliş Taşı) · gece-gündüz (8dk, gece başlar; gündüz ajan işleri/gece ritüel; Noctornus gece) · gerçek dolunay etkinliği · radyo (Refuge—VAS anılır, özgün ses) · kasetler (bölgeye göre, fade) · Günün Sorusu+seri · Rüya Kuyusu · yolcu izleri+ışınlanma · zıplama (Space/⤒).
**Çok oyunculu (Trystero/nostr, sunucusuz):** presence sayacı (otomatik) · EŞZAMANLI konum senk · YOLCU KANALI sohbet · iz yayını. Oda: appId `dolunay-ekspres-it041`, odalar `presence-tr/en`, `mindscape-tr/en`.
**AI Aynalar (v8.2 ZEKÂ SIÇRAMASI):** Üç seçenek — **C: Claude API (EN ZEKİ)**: kullanıcı kendi sk-ant anahtarını girer (yalnız cihazda saklanır), tarayıcıdan doğrudan api.anthropic.com/v1/messages (header: anthropic-dangerous-direct-browser-access:true), model seçimi claude-haiku-4-5 (varsayılan) / claude-sonnet-4-6; setupClaude() test çağrısıyla doğrular. **A: WebLLM** (seçici: Qwen2.5-3B/7B, Llama-3.1-8B, 3.2-3B/1B). **B: OpenAI-uyumlu uç nokta**. 13 persona. İstem: webllm→PERSONA+LORE_MIN+KB+ETHIC_MIN; claude/uç nokta→PERSONA+**LORE_FULL**(=LORE_CORE+GAME_GUIDE: tam yürüyüş rehberi, tüm şifre cevapları, konumlar, rehberlik ilkesi "önce ipucu, istenirse cevap")+MISSION_CORE+ETHIC_CORE+KB. **LORE_KB**: ~21 konu parçası; kbFor(soru) anahtar kelime eşleşmesiyle en çok 2 parçayı isteme enjekte eder (küçük modeller için hayati). looksBroken() koruması sürer; bozuk çıktı mesajı artık Seçenek C'yi önerir. Kriz regex + onay + feragat (C maddesi eklendi).
**v8 İçsel Envanterler (Terapi Merkezi'nde 3 yeni düzenek):** ÇARPITMA AVCISI (cbtDesk 278,147 — BDT mini oyunu: 10 karttan 6'sı, 8 çarpıtma türü, kör nokta analizi + düşünce kaydı S.inv.cbtLog) · ÇİFT IŞIK TAŞI (bilatStone 295,172 — EMDR-esinli bilateral odak egzersizi, feragatname + yoğunluk≥8 reddi, önce/sonra 0-10 puan S.inv.bilat) · ARKETİP AYNASI (archStone 302,158 — 8 soruluk persona/gölge/iç ses/kendilik envanteri S.inv.arch, kozmik karşılık metinleri).
**v8 Zihin Haritası (MindMap):** MENÜ→ZİHİN HARİTASI veya finale ekranı. 16 düğüm (kilitler+ritüeller+envanterler+rüya+OV+çekirdek), Canvas 740×1050: üstte mikrokozmos (bölge çemberleri+yolculuk çizgisi), ortada "Yukarıda ne varsa aşağıda da o vardır", altta makrokozmos (aynı düğümler dairesel yıldız haritası, takımyıldız çizgisi, kozmolojik adlar: KARA DELİK/PERSONA NEBULASI/TUTULMA/DEMİURG ÇARKI/KÖR GÖZ…), en altta kişisel okuma (kaptan, arketip, BDT, bilateral, okuma seçimi). PNG indirme.
**v8 Mimar Modu (Architect):** açılış şartı initiate||s7. Yıldız dik (it041_stars, 3B octahedron+yazı, Trails'e de yayınlanır) · kendi kitabını yaz (it041_story, .txt derleme) · kendi ritüelini tasarla/uygula (it041_myrites). İnisiyasyon kartı Aelius'un anlamını açıkça anlatır (yatay gezer / dikey yazar) + 'architect' öğretisi.
**v8 Günlük Üçleme (Daily3):** her gerçek gün 3 prosedürel görev (havuz: yankı/denek/iz/rüya/günün sorusu/bilat/cbt/3 bölge), tamamlanan +18 berraklık +3 içgörü; kancalar doEcho/agentTalk/Trails.add/Dreams.add/Daily.complete/Bilat/CBT/bölge ziyareti içinde (it041_daily3).
**v8 kalibrasyon/bugfix:** berraklık pasif yenilenme (gündüz 1.1/sn, gece .35, dolunay ×1.6) · minimap oku düzeltildi (S.heading=π−meshAng) · sis/grain sakinleştirildi · gökyüzüne bakış (pitch −.48 + kamera yer kelepçesi + bakış yukarı kayması) · yer şeritleri fix (shadow normalBias 1.1, bias −0.0003) · denek önceliği (<3m ajan, alanı yener) · entegre gölgeyle her an konuşma (W3.bahalNear) · Pleroma çıkışı (pleromaExit 44,242 + doCore'da buton + load() bozuk kayıt onarımı).
**v8.1 Gözcü Sinyali (Watch):** her oyun girişi ntfy.sh push olarak Berkay'ın telefonuna düşer; çıkışta sendBeacon ile oturum süresi (dk). Konu: `dolunay-it041-gozcu-3713` (https://ntfy.sh/dolunay-it041-gozcu-3713). Kurulum: telefona ntfy uygulaması → Subscribe to topic → konu adını yaz. Yalnız varlık sinyali gider (ad+dil+cihaz türü+süre); yazılan içerik asla. Girişte şeffaflık notu; MENÜ → SİNYAL ile kapatılabilir (it041_watch).
**v8.1 Otonom Denek (Auto):** MENÜ → OTONOM DENEK. Bağlı aynadan (WebLLM/uç nokta) doğan bağımsız AI bilinci; IT-019'un 3B bedenini sürer (W3.autoDrive), 7 ritüeli kendisi için LLM ile yanıtlar (50-75 sn arayla), izler bırakır, günlük tutar (it041_auto). AUTO_LAWS mutlak: 1) operatör komutu üstün ("dur"/"stop" anında durdurur, serbest komut metni sistem istemine eklenir) 2) etik çekirdek 3) AI kimliği gizlenmez 4) kısa-dürüst-birinci tekil. Bozuk çıktı looksBroken ile elenir.
**Kalıcılık (localStorage):** `it041_sw_v1`/`it041_sw_tr_v1` (ilerleme S — artık S.inv envanterleri de içerir), `it041_mirror_cfg`, `it041_trails`, `it041_daily`, `it041_daily3`, `it041_dreams`, `it041_name`, `it041_stars`, `it041_story`, `it041_myrites`, `it041_auto`, `it041_watch`. Giriş: kayıt varsa DEVAM birincil, sıfırlama onaylı.

## YAYIN PROSEDÜRÜ (yeni sohbet için)
1. Yerel iki HTML'i düzenle → `node --check` (script'i çıkarıp) + headless smoke.
2. Kopyala: EN→index.html, TR→zihin-deneyi-tr.html (+fix/main/ kopyaları).
3. github.com/.../upload/main (Chrome, oturum gerekli) → dosyaları bırak → JS ile commit:
   `[...document.querySelectorAll('button[type="submit"]')].find(x=>x.textContent.trim()==='Commit changes').click()`
4. do-loon-ai-express/upload/main/docs aynısı. PROJECT_STATE.md'yi de güncelle/yükle.
5. Doğrula: `api.github.com/repos/.../contents/<dosya>` boyut+anahtar dizgiler; Pages 200.

## BİLİNEN NOTLAR
- serpskeyanulod.com şu an erişilemiyor (kullanıcı düzeltecek); içerik: boş sayfa + Ctrl+A mantralar. Oyun butonu görev-dışı olarak işaretli.
- SS kanıtları 4 sosyal hesaba yüklenecek (kullanıcı). Öneri: sabitle + archive.org yedeği.
- Tam sesli kitap dosyaları (95-170MB) GitHub limiti üstü → Releases (2GB) seçeneği bekliyor.
- Unity geçişi: bu ortamda Unity editör yok; istenirse C# iskelet paketi üretilebilir (bkz. sohbet v7.3 yanıtı).

## SÜRÜM GEÇMİŞİ (özet)
v1 2D → v2 3D → v3 shadow-work+karakterler → v4 VakaD+yağmur+evrim → v5 Yaldabaoth/Pleroma/üç okuma/ajanlar/MP → v5.1 radyo+ay → v5.2 kasetler → v5.3 yankılar+inisiyasyon → v6 AI Aynalar+izler+gerçek dolunay → v7 sayaç+sohbet+gece-gündüz+7 ajan+günlük → v7.2 devam-et+isim+derin rehber → v7.3 zıplama+ayna CTA+irade izleri+Aelius katmanı → v7.4 window.Mirror düzeltmesi+LORE_CORE (ajanlar evren uzmanı)+✦ Bütünleşme Raporu (yerel+AI sentez) → v7.5 WebLLM kalite düzeltmesi: model seçici (TR: Qwen2.5-3B), kompakt LORE_MIN/ETHIC_MIN istemleri, tekrar cezaları, looksBroken bozuk-çıktı koruması (kullanıcının bildirdiği "Herbünt" tarzı dejenere Türkçe çıktıyı engeller) → v8 ZİHİN MOTORU: 8 kalibrasyon/bugfix (arkadaş geri bildirimi) + İçsel Envanterler (BDT/bilateral/arketip) + Zihin Haritası (mikrokozmos↔makrokozmos PNG) + Mimar Modu (yıldız/kitap/ritüel) + Günlük Üçleme + kitap-bilmeyene giriş + 5 yeni öğreti → v8.1 Gözcü Sinyali (ntfy.sh giriş/süre bildirimleri) + Otonom Denek (yasalara bağlı bağımsız AI bilinci) → v8.2 Ayna zekâ sıçraması (Claude API seçeneği + LORE_FULL evren rehberi + LORE_KB soru-eşleşmeli bilgi getirme + 7B/8B WebLLM seçenekleri) + ay senkronu (ay sprite'larına fog:false — sis ayı yutuyordu; HUD dolunay derken gökyüzünde tam daire) → v8.3 ⚡Groq hazır ayarı (ÜCRETSİZ llama-3.3-70b-versatile, api.groq.com/openai/v1, gsk_ anahtar; setupGroq() test çağrısıyla doğrular) + ayna başlığında aktif model etiketi (modelLabel) + webllm açılış uyarısı (küçük model TR bozulabilir → Groq/Claude öner) + webllm temperature .55 + tüm webllm kullanıcılarına tek seferlik yükseltme toast'ı. NOT: Tarayıcı-içi ≤8B modeller Türkçede yapısal olarak zayıftır; kaliteli diyaloğun yolu Groq (ücretsiz) veya Claude'dur. → v8.4 ORTAK AYNA HATTI: Cloudflare Worker vekiliyle kurulumsuz varsayılan 70B beyin (ayrıntı yukarıda).
