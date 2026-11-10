const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("capyNative", {
  alert: (m) => ipcRenderer.sendSync("dlg", "alert", String(m)),
  confirm: (m) => ipcRenderer.sendSync("dlg", "confirm", String(m)),
});
