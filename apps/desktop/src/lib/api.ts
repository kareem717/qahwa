import { createClient as createSdkClient } from "@qahwa/sdk";

const createClient = async () => {
  const token = await window.electronAuth.getToken();

  return createSdkClient({
    baseUrl: import.meta.env.VITE_API_URL,
    token,
  });
};

let client: Awaited<ReturnType<typeof createClient>> | null = null;

export const getClient = async () => {
  if (!client) {
    client = await await createClient();
  }

  return client;
};
