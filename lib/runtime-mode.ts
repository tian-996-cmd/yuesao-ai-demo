const env = (
  import.meta as ImportMeta & { env?: Record<string, string | undefined> }
).env;
export const isProductionMode = env?.VITE_APP_MODE === 'production';
export const apiBaseUrl =
  env?.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api/v1';
