# Eksi Filtre

Ekşi Sözlük sol panelindeki başlıkları filtrelemeni sağlayan tarayıcı eklentisi.

## Ne yapar?

- Sol paneldeki her başlığın yanına bir **× (kaldır)** butonu ekler.
- Butona tıklayınca o başlığı listeden kalıcı olarak gizler.
- Gizlenen başlıklar `chrome.storage.local`'da saklanır — **sayfa yenilense bile sol panelden kaybolmaz.**
- Eklenti popup'ından gizlediğin başlıkları görüp tek tek geri alabilir veya hepsini temizleyebilirsin.

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `manifest.json` | Manifest V3 tanımı (izinler, içerik betiği) |
| `content.js` | Sol paneldeki başlık listesine buton ekler ve filtreleri uygular |
| `popup.html` / `popup.js` | Filtrelenmiş başlıkları yönetme arayüzü |
| `icons/icon128.png` | Eklenti simgesi |

## Kurulum

### Chrome / Edge / Brave
1. `chrome://extensions` sayfasını aç.
2. Sağ üstte **Geliştirici modu**'nu aç.
3. **Paketlenmemiş öğe yükle**'ye tıkla.
4. Bu klasörü (`eksi-filtre`) seç.

### Firefox
1. `about:debugging#/runtime/this-firefox` sayfasını aç.
2. **Geçici Eklenti Yükle**'ye tıkla ve `manifest.json`'ı seç.

> Not: Firefox'ta `all_frames: true` içerik betiği, eksi sözlüğün sol çerçevesi ayrı bir frame olarak yükleniyorsa gerekir. Ana sayfa tek frame ise sorun değil.

## Nasıl çalışır?

- Eklenti, sayfadaki başlık linklerini (`/baslik/...`, `/entry/...`) bulup başlık listesini tanır.
- Gizlenen başlıklar `blockedTitles` anahtarı altında saklanır.
- Sayfa yüklendiğinde ve değiştiğinde (AJAX/SPA navigasyonu) `MutationObserver` ile liste yeniden taranır ve engellenen başlıklar gizlenir.

## Gizlilik

Veriler yalnızca **kendi tarayıcında** `chrome.storage.local` üzerinde tutulur; hiçbir sunucuya gönderilmez.
