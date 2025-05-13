import { app, BrowserWindow, shell } from "electron";
import registerListeners from "./lib/helpers/ipc/listeners-register";
// "electron-squirrel-startup" seems broken when packaging with vite
//import started from "electron-squirrel-startup";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

const inDevelopment = process.env.NODE_ENV === "development";
const PROTOCOL = 'note-app'; // Define your custom protocol

// Declare mainWindow in a broader scope
let mainWindow: BrowserWindow | null = null;

// Helper function to handle the deep link URL
function handleDeepLinkUrl(url: string | undefined) {
  if (!url || !url.startsWith(`${PROTOCOL}://auth?key=`)) return; // Check if it's our auth callback
  console.log("Auth callback URL received:", url);

  // Parse the URL to get the token/data Clerk sends back
  // Example: const params = new URL(url).searchParams;
  // const clerkToken = params.get('clerk_session_token'); // Fictional parameter name

  if (mainWindow) {
    // Send the relevant part of the URL or the extracted token to the Renderer
    mainWindow.webContents.send('clerk-auth-callback', url); // Send the whole URL, let renderer parse
  }
}

// Handle protocol for Windows/Linux and when app is already running
if (process.platform === 'win32' || process.platform === 'linux') {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      // commandLine will contain the URL as an argument.
      const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL}://`));
      handleDeepLinkUrl(url);

      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}

function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  mainWindow = new BrowserWindow({ // Assign to the broader scope mainWindow
    width: 800,
    height: 600,
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true, // Be cautious with this setting
      nodeIntegrationInSubFrames: false,
      preload: preload,
    },
    frame: false,
    ...(process.platform !== 'darwin' ? {
      titleBarOverlay: true
    } : {
      trafficLightPosition: { x: 16, y: 12 },
      titleBarStyle: 'hidden',
    })
  })
  registerListeners(mainWindow);

  mainWindow.setWindowButtonVisibility(true);

  // Add this handler to open links in the default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Basic security check: only allow http and https protocols
    if (details.url.startsWith('http:') || details.url.startsWith('https:')) {
      shell.openExternal(details.url); // Opens the URL in the default browser
    }
    return { action: 'deny' }; // Prevents Electron from opening a new window
  });

  // @ts-expect-error 
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // @ts-expect-error 
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      // @ts-expect-error
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null; // Dereference on close
  });
}

async function installExtensions() {
  if (inDevelopment) { // Only install dev tools in development
    try {
      const result = await installExtension(REACT_DEVELOPER_TOOLS);
      console.log(`Extensions installed successfully: ${result.name}`);
    } catch (e) { // Catch specific error
      console.error("Failed to install extensions:", e);
    }
  }
}

// Register the protocol
// Needs to be done before app ready for some cases, or after for others.
// Placing it here, but can be moved inside whenReady if issues arise.
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [process.argv[1]]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

app.whenReady().then(async () => { // Make async for await installExtensions
  createWindow();
  await installExtensions(); // Await extensions

  // Handle initial launch via protocol on Windows/Linux
  // For Windows, process.argv might contain the URL if the app was launched by it
  // and it's not the second instance.
  if (process.platform === 'win32' || process.platform === 'linux') {
    const url = process.argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
    if (url) { // Check if launched via protocol, and not handled by second-instance
      setTimeout(() => handleDeepLinkUrl(url), 500); // Delay to ensure window is ready
    }
  }
});

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle protocol for macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLinkUrl(url);
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends