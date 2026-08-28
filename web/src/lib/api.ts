/// <reference types="vite/client" />
import axios from 'axios';

const defaultBaseUrl = import.meta.env.DEV ? 'http://localhost:4000' : '';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== '' 
    ? import.meta.env.VITE_API_BASE_URL 
    : defaultBaseUrl,
  withCredentials: true, // accept httpOnly cookie + send it back
  // 60s covers the slowest case (a Gemini reply can take 10–20s, plus the
  // backend round-trip + DB writes). Fast endpoints resolve in <1s so
  // a generous ceiling doesn't hurt UX.
  timeout: 60000,
});

export function getErrorMessage(err: any, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (data?.error) return data.error as string;
  if (data?.issues) {
    const first = Object.entries(data.issues).find(([, v]) => Array.isArray(v) && (v as string[]).length);
    if (first) return (first[1] as string[])[0];
  }
  return err?.message || fallback;
}