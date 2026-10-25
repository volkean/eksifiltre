// Eksi Filtre popup: filtered titles management

const STORAGE_KEY = "blockedTitles";

function getBlocked() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (data) => {
      resolve(new Set(data[STORAGE_KEY] || []));
    });
  });
}

function saveBlocked(set) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: [...set] }, resolve);
  });
}

const listEl = document.getElementById("list");
const countEl = document.getElementById("count");
const emptyEl = document.getElementById("empty");
const hintEl = document.getElementById("hint");
const clearAllBtn = document.getElementById("clearAll");

function render(blocked) {
  const entries = [...blocked].sort((a, b) => a.localeCompare(b, "tr"));
  countEl.textContent = `${entries.length} baslik`;

  emptyEl.hidden = entries.length > 0;
  clearAllBtn.hidden = entries.length === 0;
  hintEl.hidden = entries.length === 0;

  listEl.textContent = "";
  for (const title of entries) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "title";
    span.textContent = title;

    const btn = document.createElement("button");
    btn.className = "remove";
    btn.title = "Kalici olarak kaldir";
    btn.textContent = "×";
    btn.addEventListener("click", async () => {
      const current = await getBlocked();
      current.delete(title);
      await saveBlocked(current);
      render(current);
    });

    li.append(span, btn);
    listEl.appendChild(li);
  }
}

clearAllBtn.addEventListener("click", async () => {
  await saveBlocked(new Set());
  render(new Set());
});

(async () => {
  render(await getBlocked());
})();
