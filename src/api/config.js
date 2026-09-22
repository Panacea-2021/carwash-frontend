const RENDER_ORIGIN = "https://carwash-backend-k3pk.onrender.com";
const RENDER_API = `${RENDER_ORIGIN}/api`;

const envUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ""
).replace(/\/$/, "");

const isUsableApiUrl = (value) =>
  /^https?:\/\//i.test(value) &&
  /\/api$/i.test(value) &&
  !/localhost|127\.0\.0\.1/i.test(value);

export const API_ORIGIN = import.meta.env.DEV ? "" : RENDER_ORIGIN;

export const API_BASE_URL = isUsableApiUrl(envUrl)
  ? envUrl
  : import.meta.env.DEV
    ? "/api"
    : RENDER_API;
