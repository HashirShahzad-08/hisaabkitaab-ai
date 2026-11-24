// Talks to the HisaabKitaab backend (FastAPI). The address comes from .env: EXPO_PUBLIC_API_URL
// Every request sends the app language (lang) and today's date (today).
import { auth } from '../firebase';
import i18n from '../i18n';
import { toDateKey } from '../utils/format';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
const TIMEOUT_MS = 30000;

// An error that carries an i18n key, so the screen can show it in the user's language.
export class ApiError extends Error {
  constructor(messageKey, detail) {
    super(messageKey);
    this.messageKey = messageKey;
    this.detail = detail;
  }
}

async function post(path, text) {
  if (!BASE_URL) throw new ApiError('api.errors.notConfigured');

  // Every call needs the logged-in user's Firebase token. No user: do not call the backend at all.
  const user = auth.currentUser;
  if (!user) throw new ApiError('errors.session_expired');
  let token;
  try {
    token = await user.getIdToken(); // refreshes by itself when it is about to expire
  } catch (e) {
    throw new ApiError('errors.session_expired', String(e));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        text,
        lang: i18n.language === 'ur' ? 'ur' : 'en',
        today: toDateKey(new Date()),
      }),
      signal: controller.signal,
    });
  } catch (e) {
    // fetch fails like this when the phone cannot reach the server, or when we gave up waiting
    console.log(`[api] ${path} could not reach ${BASE_URL}:`, String(e));
    throw new ApiError(e?.name === 'AbortError' ? 'api.errors.timeout' : 'api.errors.network', String(e));
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // not JSON
  }

  if (!response.ok) {
    // The backend sends { error: "...", code: "..." } when the AI fails. 422 means we sent bad input.
    // Log the real reason in the Expo terminal so it is easy to debug.
    console.log(`[api] ${path} failed: HTTP ${response.status}`, JSON.stringify(data));
    let key = 'api.errors.ai';
    if (response.status === 401) key = 'errors.session_expired';
    else if (response.status === 429) key = 'errors.too_many';
    else if (response.status === 422) key = 'api.errors.badInput';
    else if (data?.code === 'ai_permission' || data?.code === 'ai_key') key = 'api.errors.aiSetup';
    else if (data?.code === 'ai_quota') key = 'api.errors.aiBusy';
    throw new ApiError(key, data?.error);
  }
  if (!data) {
    console.log(`[api] ${path} returned an empty or non-JSON reply (HTTP ${response.status})`);
    throw new ApiError('api.errors.ai');
  }
  return data;
}

// Returns { amount, type, category, paymentType, merchant, date, isScam, scamReason }
export const parseSms = (text) => post('/parse-sms', text);

// Returns { transactions: [{ amount, type, category, paymentType, merchant, date, note }] }
export const quickEntry = (text) => post('/quick-entry', text);
