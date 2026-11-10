// Capy Chiến Binh chạy như phần mềm trên máy. Trang ThoiQuen.html đọc/ghi dữ liệu qua một máy chủ nhỏ
// ngay trong app, chỉ nghe trên máy này (127.0.0.1); không có gì gửi ra ngoài.
const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

// Dữ liệu nằm riêng với chỗ cài app, nên cập nhật hay gỡ app cũng không mất.
const HOME = "D:\\Datacenter\\6. Personal Projects\\ThoiQuen-KeHoach";
const ROOT = process.env.CAPY_DATA_DIR || (fs.existsSync(HOME) ? HOME : path.join(app.getPath("documents"), "Capy Chien Binh"));
const DATA_FILE = path.join(ROOT, "du-lieu.json");
const PREFS_FILE = path.join(ROOT, "cai-dat.json");
const BAK_DIR = path.join(ROOT, "sao-luu");
const HTML = path.join(__dirname, "..", "ThoiQuen.html");
const ICON = path.join(__dirname, "..", "app-icon.ico");
const KEEP_BAK = 60;
let port = 0;

const counts = (j) => (j ? (Array.isArray(j.habits) ? j.habits.length : 0) + (Array.isArray(j.tasks) ? j.tasks.length : 0) : 0);
const stamp = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString();

// ghi file tạm rồi đổi tên, để lỗi giữa chừng không bao giờ để lại file ghi dở
function writeSafe(file, data) {
  fs.writeFileSync(file + ".tmp", data);
  fs.renameSync(file + ".tmp", file);
}
function pruneBackups() {
  const old = fs.readdirSync(BAK_DIR).filter((f) => f.endsWith(".json"))
    .map((f) => ({ f, t: fs.statSync(path.join(BAK_DIR, f)).mtimeMs })).sort((a, b) => b.t - a.t).slice(KEEP_BAK);
  for (const { f } of old) fs.rmSync(path.join(BAK_DIR, f), { force: true });
}
function backupList() {
  return fs.readdirSync(BAK_DIR).filter((f) => f.endsWith(".json"))
    .map((name) => {
      const file = path.join(BAK_DIR, name);
      let habits = 0, tasks = 0;
      try { const j = JSON.parse(fs.readFileSync(file, "utf8")); habits = (j.habits || []).length; tasks = (j.tasks || []).length; } catch {}
      return { name, habits, tasks, t: fs.statSync(file).mtimeMs };
    }).sort((a, b) => b.t - a.t).map(({ t, ...b }) => b);
}
// Trả về [mã, nội dung]. Từ chối bản ghi làm mất phần lớn dữ liệu, trừ khi người dùng đã xác nhận.
function saveData(body, allowShrink) {
  const text = body.toString("utf8").trimStart();
  if (!text.startsWith("{") || !text.includes('"habits"')) return [400, "Dữ liệu không hợp lệ"];
  let nj;
  try { nj = JSON.parse(text); } catch { return [400, "Dữ liệu không hợp lệ"]; }
  const old = fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE) : null;
  let oj = null;
  try { if (old) oj = JSON.parse(old.toString("utf8")); } catch {}
  const on = counts(oj), nn = counts(nj);
  const shrink = on > 0 && (nn === 0 || (nn * 2 < on && on - nn >= 3));
  if (shrink && !allowShrink) return [409, JSON.stringify({ old: on, new: nn })];
  if (old && on > 0) {
    const daily = path.join(BAK_DIR, `du-lieu-${stamp().slice(0, 10)}.json`);
    if (!fs.existsSync(daily)) fs.writeFileSync(daily, old);
    if (shrink) fs.writeFileSync(path.join(BAK_DIR, `du-lieu-truoc-khi-xoa-${stamp().slice(0, 19).replace(/[T:]/g, "-")}.json`), old);
    pruneBackups();
  }
  writeSafe(DATA_FILE, body);
  return [200, "ok"];
}

function handle(req, res, body) {
  const send = (code, data, type = "text/plain; charset=utf-8") => {
    res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  };
  const JSON_T = "application/json; charset=utf-8";
  // chỉ đúng app này: chặn trang web khác và thủ thuật DNS chạm tới dữ liệu
  if (req.headers.host !== `127.0.0.1:${port}`) return send(403, "forbidden");
  if (req.method === "POST" && req.headers["x-capy"] !== "1") return send(403, "forbidden");
  const url = new URL(req.url, "http://127.0.0.1"), p = url.pathname, get = req.method === "GET", post = req.method === "POST";

  if (get && (p === "/" || p === "/index.html")) return send(200, fs.readFileSync(HTML), "text/html; charset=utf-8");
  if (get && (p === "/app-icon.ico" || p === "/favicon.ico")) return send(200, fs.readFileSync(ICON), "image/x-icon");
  if (p === "/ping") return send(200, "capy");
  if (get && p === "/info") return send(200, JSON.stringify({ data: DATA_FILE, backups: BAK_DIR }), JSON_T);
  if (get && p === "/data") return send(200, fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE) : "", JSON_T);
  if (post && p === "/data") {
    const [code, msg] = saveData(body, req.headers["x-allow-shrink"] === "1");
    return send(code, msg, code === 409 ? JSON_T : undefined);
  }
  if (get && p === "/prefs") return send(200, fs.existsSync(PREFS_FILE) ? fs.readFileSync(PREFS_FILE) : "{}", JSON_T);
  if (post && p === "/prefs") {
    try { JSON.parse(body.toString("utf8")); } catch { return send(400, "JSON không hợp lệ"); }
    writeSafe(PREFS_FILE, body);
    return send(200, "ok");
  }
  if (get && p === "/backups") return send(200, JSON.stringify(backupList()), JSON_T);
  if (get && p === "/backup") {
    const n = url.searchParams.get("n") || "";
    if (!/^[\w.-]+\.json$/.test(n)) return send(400, "bad name");
    const f = path.join(BAK_DIR, n);
    return fs.existsSync(f) ? send(200, fs.readFileSync(f), JSON_T) : send(404, "not found");
  }
  if (post && p === "/open-folder") { shell.openPath(ROOT); return send(200, "ok"); }
  send(404, "not found");
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    try { handle(req, res, Buffer.concat(chunks)); }
    catch (e) { if (!res.headersSent) res.writeHead(500); res.end(String(e.message)); }
  });
});

// hộp thoại của Windows; alert/confirm gốc của Electron làm ô nhập mất focus sau khi đóng
ipcMain.on("dlg", (e, kind, message) => {
  const win = BrowserWindow.fromWebContents(e.sender), ask = kind === "confirm";
  const r = dialog.showMessageBoxSync(win, { type: ask ? "question" : "info", title: "Capy Chiến Binh", message,
    buttons: ask ? ["OK", "Cancel"] : ["OK"], defaultId: 0, cancelId: ask ? 1 : 0, noLink: true });
  win.blur(); win.focus(); win.webContents.focus();
  e.returnValue = r === 0;
});

function createWindow() {
  const win = new BrowserWindow({ width: 1280, height: 880, minWidth: 380, title: "Capy Chiến Binh", icon: ICON,
    autoHideMenuBar: true, backgroundColor: "#fbf5ea",
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.cjs") } });
  win.maximize();
  win.loadURL(`http://127.0.0.1:${port}/`);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  // đóng cửa sổ ngay sau khi sửa: ghi nốt thay đổi cuối vào file rồi mới đóng thật
  let flushed = false;
  win.on("close", (e) => {
    if (flushed) return;
    e.preventDefault();
    const flush = win.webContents.executeJavaScript("typeof writeNow==='function'&&wTimer?writeNow():0").catch(() => {});
    Promise.race([flush, new Promise((r) => setTimeout(r, 2000))]).then(() => { flushed = true; win.close(); });
  });
}

// mỗi lúc chỉ một cửa sổ, để hai bản không ghi đè dữ liệu của nhau
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
  });
  app.whenReady().then(() => {
    fs.mkdirSync(BAK_DIR, { recursive: true });
    Menu.setApplicationMenu(null);
    server.listen(0, "127.0.0.1", () => { port = server.address().port; createWindow(); });
  });
  app.on("window-all-closed", () => app.quit());
}
