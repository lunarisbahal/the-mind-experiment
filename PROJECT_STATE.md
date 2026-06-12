# DO-LOON-AI EXPRESS · THE MIND EXPERIMENT — PROJE DURUMU
*Sürüm: v7.3 · Bu dosya her güncellemede yenilenir. Yeni bir sohbette/sekmede buradan devam edilebilir.*

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
**AI Aynalar:** WebLLM (Llama-3.2-1B-Instruct-q4f16_1-MLC) veya OpenAI-uyumlu uç nokta (Ollama). 13 persona (6 ana + 7 ajan IT-019/033/058/077/009/104/062). Her istem = PERSONA + MISSION_CORE + ETHIC_CORE (kaynakta açık). Kriz regex + onay + feragat.
**Kalıcılık (localStorage):** `it041_sw_v1`/`it041_sw_tr_v1` (ilerleme S), `it041_mirror_cfg`, `it041_trails`, `it041_daily`, `it041_dreams`, `it041_name`. Giriş: kayıt varsa DEVAM birincil, sıfırlama onaylı.

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
v1 2D → v2 3D → v3 shadow-work+karakterler → v4 VakaD+yağmur+evrim → v5 Yaldabaoth/Pleroma/üç okuma/ajanlar/MP → v5.1 radyo+ay → v5.2 kasetler → v5.3 yankılar+inisiyasyon → v6 AI Aynalar+izler+gerçek dolunay → v7 sayaç+sohbet+gece-gündüz+7 ajan+günlük → v7.2 devam-et+isim+derin rehber → v7.3 zıplama+ayna CTA+irade izleri+Aelius katmanı.
