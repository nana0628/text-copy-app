const STORAGE_KEY = "text-copy-items";

let items = loadItems();
let draggedId = null;

const editor = document.getElementById("editor");
const textInput = document.getElementById("textInput");
const starInput = document.getElementById("starInput");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const count = document.getElementById("count");
const toast = document.getElementById("toast");

document.getElementById("addBtn").addEventListener("click", () => {
  editor.classList.remove("hidden");
  textInput.focus();
});

document.getElementById("cancelBtn").addEventListener("click", closeEditor);

document.getElementById("saveBtn").addEventListener("click", () => {
  const text = textInput.value.trim();

  if (!text) {
    textInput.focus();
    return;
  }

  items.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    text,
    starred: starInput.checked
  });

  saveItems();
  render();
  closeEditor();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (!items.length) return;

  if (confirm("保存したテキストをすべて削除しますか？")) {
    items = [];
    saveItems();
    render();
  }
});

document.getElementById("csvInput").addEventListener("change", handleCSV);

function closeEditor() {
  editor.classList.add("hidden");
  textInput.value = "";
  starInput.checked = false;
}

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
  list.innerHTML = "";

  // ★付きは上へ。その中では現在の並び順を維持
  const sorted = [...items].sort((a, b) => Number(b.starred) - Number(a.starred));

  sorted.forEach(item => {
    const row = document.createElement("div");
    row.className = "item" + (item.starred ? " starred" : "");
    row.draggable = true;
    row.dataset.id = item.id;

    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.title = "ドラッグして並べ替え";
    handle.textContent = "☷";

    const text = document.createElement("div");
    text.className = "item-text";
    if (item.starred) {
      const star = document.createElement("span");
      star.className = "star";
      star.textContent = "★";
      text.appendChild(star);
    }
    text.appendChild(document.createTextNode(item.text));

    const copy = document.createElement("button");
    copy.className = "copy-btn";
    copy.textContent = "コピー";
    copy.addEventListener("click", () => copyText(item.text));

    row.append(handle, text, copy);

    row.addEventListener("dragstart", () => {
      draggedId = item.id;
      row.classList.add("dragging");
    });

    row.addEventListener("dragend", () => {
      draggedId = null;
      row.classList.remove("dragging");
      document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
    });

    row.addEventListener("dragover", e => {
      e.preventDefault();
      if (draggedId !== item.id) row.classList.add("drag-over");
    });

    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));

    row.addEventListener("drop", e => {
      e.preventDefault();
      row.classList.remove("drag-over");
      if (!draggedId || draggedId === item.id) return;

      const from = items.findIndex(x => x.id === draggedId);
      const to = items.findIndex(x => x.id === item.id);
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);

      saveItems();
      render();
    });

    list.appendChild(row);
  });

  count.textContent = `${items.length}件`;
  empty.style.display = items.length ? "none" : "block";
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("コピーしました");
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("コピーしました");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1200);
}

function handleCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const rows = parseCSV(reader.result);

    if (!rows.length) {
      alert("CSVから読み込めるテキストがありません。");
      return;
    }

    // 1列目をテキストとして読み込み。
    // 2列目が true / 1 / ★ / yes の場合は★付きとして扱う。
    const imported = rows
      .filter(row => row[0] && row[0].trim())
      .map(row => ({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        text: row[0].trim(),
        starred: row[1] ? ["true", "1", "★", "yes"].includes(row[1].trim().toLowerCase()) : false
      }));

    items.push(...imported);
    saveItems();
    render();
    event.target.value = "";
    showToast(`${imported.length}件読み込みました`);
  };

  reader.readAsText(file, "UTF-8");
}

// RFC 4180に近い簡易CSVパーサー。
// ダブルクォート内のカンマ・改行にも対応。
function parseCSV(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    const next = csv[i + 1];

    if (c === '"') {
      if (quoted && next === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some(v => v !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    if (row.some(v => v !== "")) rows.push(row);
  }

  // ヘッダーが「text」「テキスト」等なら除外
  if (rows.length && /^(text|テキスト|内容)$/i.test(rows[0][0].trim())) {
    rows.shift();
  }

  return rows;
}

render();
