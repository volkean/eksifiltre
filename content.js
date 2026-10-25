// Eksi Filtre content script.
// Sol paneldeki (ul.topic-list) giris basliklarinin yanina filtre butonu ekler.
// Secilen basliklar kalici olarak (chrome.storage.local) gizlenir; sayfa
// yenilense de gizli kalir.

(() => {
  "use strict";

  const STORAGE_KEY = "blockedTitles";
  const BTN_CLASS = "eksi-filtre-remove";
  const SYNC_PATH = "/kendime-not--375360";
  const SYNC_PANEL_ID = "eksi-filtre-sync";

  // Baslik linki deseni: /slug--id (ve bazen ?day=... sorgusu).
  const TOPIC_HREF_RE = /\/(baslik\/)?[a-z0-9\-]+--\d+(\?|$)/i;

  // Buton stilini sayfaya ekler.
  function ensureStyles() {
    if (document.getElementById("eksi-filtre-style")) return;
    const style = document.createElement("style");
    style.id = "eksi-filtre-style";
    style.textContent = `
ul.topic-list > li {
  display: flex;
  align-items: center;
  gap: 8px;
}
ul.topic-list > li > a {
  flex: 1;
  min-width: 0;
}
.${BTN_CLASS} {
  appearance: none;
  border: none;
  background: transparent;
  color: #999;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0 5px;
  border-radius: 3px;
  vertical-align: middle;
  flex-shrink: 0;
}
.${BTN_CLASS}:hover {
  color: #e5484d;
  background: rgba(229, 72, 77, 0.12);
}
#${SYNC_PANEL_ID} {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
  font-size: 13px;
}
#${SYNC_PANEL_ID} button {
  cursor: pointer;
  padding: 3px 10px;
}
`;
    (document.head || document.documentElement).appendChild(style);
  }

  function getBlocked() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (data) => {
        resolve(new Set(data[STORAGE_KEY] || []));
      });
    });
  }

  async function saveBlocked(set) {
    await chrome.storage.local.set({ [STORAGE_KEY]: [...set] });
  }

  // Bir li'nin gorunur olup olmadigini kontrol eder (mobile-only vb. atlar).
  function isVisible(li) {
    if (li.classList.contains("mobile-only") || li.classList.contains("hidden")) return false;
    const style = getComputedStyle(li);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  // Sol panel giris baslik listesini bulur.
  function findTopicList() {
    // Tercih edilen: ul.topic-list
    const direct = document.querySelector("ul.topic-list");
    if (direct) return direct;

    // Fallback: icinde bu degerde slug--id linkleri gecen en buyuk liste.
    let best = null;
    let bestCount = 0;
    document.querySelectorAll("ul, ol").forEach((ul) => {
      const count = Array.from(ul.querySelectorAll(":scope > li a")).filter((a) =>
        TOPIC_HREF_RE.test(a.getAttribute("href") || "")
      ).length;
      if (count > bestCount) {
        bestCount = count;
        best = ul;
      }
    });
    return bestCount >= 2 ? best : null;
  }

  // Bir li icindeki baslik adini cikarir.
  // <small> (entry sayisi) ve sayi metni temizlenir; sadece baslik metni kalir.
  function liTitle(li) {
    const a = li.querySelector("a");
    if (!a) return (li.textContent || "").replace(/\s+/g, " ").trim();

    const clone = a.cloneNode(true);
    clone.querySelectorAll("small, .count, sup").forEach((n) => n.remove());
    return (clone.textContent || "").replace(/\s+/g, " ").trim();
  }

  async function processList(container) {
    if (container.dataset.eksiFiltreBound) return;
    container.dataset.eksiFiltreBound = "1";

    const blocked = await getBlocked();

    const items = Array.from(container.querySelectorAll(":scope > li"));
    for (const li of items) {
      if (!isVisible(li)) continue;

      // Baslik linki (slug--id) olmayan li'leri atla (bolum basligi, bos satir vb.).
      const a = li.querySelector("a");
      if (!a || !TOPIC_HREF_RE.test(a.getAttribute("href") || "")) continue;

      const title = liTitle(li);
      if (!title) continue;

      // Gizlenmis baslik ise listeyi gizle.
      if (blocked.has(title)) {
        li.style.display = "none";
        continue;
      }

      // Buton zaten varsa atla.
      if (li.querySelector("." + BTN_CLASS)) continue;

      const btn = document.createElement("button");
      btn.className = BTN_CLASS;
      btn.type = "button";
      btn.title = "“" + title + "” basligini filtrele";
      btn.setAttribute("aria-label", "Filtrele: " + title);
      btn.textContent = "×";

      btn.addEventListener("click", async () => {
        const current = await getBlocked();
        current.add(title);
        await saveBlocked(current);
        li.style.display = "none";
      });

      li.appendChild(btn);
    }
  }

  // "kendime not" basligindaki taslak kutusu uzerinden cihazlar arasi senkron.
  // Liste #editbox icinde JSON dizisi olarak tutulur; kaydetmeyi kullanici yapar.
  function ensureSyncPanel() {
    if (!location.pathname.startsWith(SYNC_PATH)) return;
    const box = document.getElementById("editbox");
    if (!box || document.getElementById(SYNC_PANEL_ID)) return;

    const panel = document.createElement("div");
    panel.id = SYNC_PANEL_ID;

    const status = document.createElement("span");
    status.className = "eksi-filtre-status";
    status.textContent = "Eksi Filtre senkron";

    const pull = document.createElement("button");
    pull.type = "button";
    pull.textContent = "kutudan al";
    pull.addEventListener("click", async () => {
      let titles;
      try {
        titles = JSON.parse(box.value);
        if (!Array.isArray(titles) || !titles.every((t) => typeof t === "string")) throw 0;
      } catch {
        status.textContent = "kutudaki metin gecerli bir liste degil";
        return;
      }
      const before = await getBlocked();
      const next = new Set(titles);
      const added = [...next].filter((t) => !before.has(t)).length;
      const removed = [...before].filter((t) => !next.has(t)).length;
      await saveBlocked(next);
      status.textContent = `${next.size} baslik alindi (+${added}, -${removed})`;
    });

    const push = document.createElement("button");
    push.type = "button";
    push.textContent = "kutuya yaz";
    push.addEventListener("click", async () => {
      const blocked = await getBlocked();
      box.value = JSON.stringify([...blocked], null, 1);
      box.dispatchEvent(new Event("input", { bubbles: true }));
      status.textContent = `${blocked.size} baslik yazildi — "kenarda dursun: dursun" secip kaydet`;
    });

    panel.append(pull, push, status);
    box.parentElement.insertBefore(panel, box);
  }

  async function scan() {
    ensureStyles();
    ensureSyncPanel();
    const list = findTopicList();
    if (list) await processList(list);
  }

  // Storage degisikliginde (popup'tan vs) listeyi yeniden filtrele.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[STORAGE_KEY]) return;
    scan();
  });

  // SPA / ajax navigasyonunda yeni icerik gelirse yeniden tara.
  const observer = new MutationObserver(() => {
    clearTimeout(observer._t);
    observer._t = setTimeout(scan, 250);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  scan();
})();
