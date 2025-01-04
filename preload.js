const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
    writeFileSync: (file, data) => ipcRenderer.invoke("writeFileSync", file, data),
    mkdirSync: (path) => ipcRenderer.invoke("mkdirSync", path),
    existsSync: (path) => ipcRenderer.invoke("existsSync", path),
});
