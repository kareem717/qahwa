import { ipcMain, shell } from "electron";
import Store from "electron-store";

const JWT_KEY = "jwt";

const store = new Store();

async function getTokenLogic() {
  const jwt = store.get(JWT_KEY) as string | null;
  if (!jwt) {
    return null;
  }

  return jwt;
  // const cookies = await session.defaultSession.cookies.get({ name: SESSION_COOKIE_NAME, url: APP_URL })
  // if (!cookies || cookies.length === 0) {
  //   throw new Error('No token found')
  // }
  // const cookie = cookies[0]

  // if (!cookie.value) {
  //   throw new Error('No token value found')
  // }

  // let expiry = 0
  // try {
  //   const payload = jwtDecode(cookie.value)
  //   if (!payload.exp) {
  //     throw new Error('Invalid token')
  //   }
  //   expiry = payload.exp
  // } catch (error) {
  //   throw new Error('Invalid token')
  // }

  // // if token expiring within 10 seconds, refresh it
  // if (expiry < (Date.now() / 1000) + 10) {
  //   const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/session`, {
  //     headers: {
  //       'Authorization': `Bearer ${cookie.value}`
  //     }
  //   })
  //   if (!res.ok) {
  //     throw new Error('Failed to refresh token')
  //   }

  //   const data = await res.json()
  //   await setTokenLogic(data.jwt)
  //   return data.jwt // Return the new token
  // }
}

async function setTokenLogic(token: string) {
  store.set(JWT_KEY, token);
}

async function removeTokenLogic() {
  store.delete(JWT_KEY);
}

export function addAuthEventListeners() {
  ipcMain.on("open-sign-in-window", () => {
    shell.openExternal(import.meta.env.VITE_SIGN_IN_URL).catch((err) => {
      console.error("Failed to open sign-in URL:", err);
      // Optionally, notify the renderer process of the failure
    });
  });

  ipcMain.handle("jwt-get-token", async () => {
    try {
      return await getTokenLogic();
    } catch (error) {
      console.error("Error getting token:", error);
      throw error; // Re-throw to be caught by the invoke call
    }
  });

  ipcMain.handle("jwt-set-token", async (_event, token: string) => {
    try {
      await setTokenLogic(token);
    } catch (error) {
      console.error("Error setting token:", error);
      throw error;
    }
  });

  ipcMain.handle("jwt-remove-token", async () => {
    try {
      await removeTokenLogic();
    } catch (error) {
      console.error("Error removing token:", error);
      throw error;
    }
  });
}
