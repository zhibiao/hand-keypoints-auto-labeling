const { app, ipcMain, BrowserWindow } = require("electron");
const path = require("node:path");
const { writeFileSync, mkdirSync, existsSync } = require("node:fs");

const createWindow = () => {
  try {
    const mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      icon: "AI.png",
      backgroundColor: "#000",
      resizable: true,
      alwaysOnTop: true,
      skipTaskbar: false,
      opacity: 1,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        backgroundThrottling: false,
        webgl: true,
      },
    });

    ipcMain.handle("mkdirSync", async (event, path) => {
      return mkdirSync(path, { recursive: true });
    });

    ipcMain.handle("writeFileSync", async (event, file, data) => {
      return writeFileSync(file, data);
    });

    ipcMain.handle("existsSync", async (event, path) => {
      return existsSync(path);
    });

    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile(path.join(__dirname, "index.html"));

    return mainWindow;
  } catch (error) {
    console.error(error);
  }
};

let mainWindow = null;

app.whenReady().then(() => {
  mainWindow = createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
