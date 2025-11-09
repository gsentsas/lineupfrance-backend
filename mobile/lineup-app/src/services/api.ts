import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
export const API_BASE_URL: string =
  (extra.apiBaseUrl as string) ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
const defaultToken: string = (extra.apiToken as string) ?? process.env.EXPO_PUBLIC_API_TOKEN ?? '';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

if (defaultToken) {
  client.defaults.headers.common.Authorization = `Bearer ${defaultToken}`;
}

export function setSessionToken(token?: string) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

export async function exchangeFirebaseToken(idToken: string, role: 'client' | 'liner') {
  const response = await client.post('/api/auth/firebase', { idToken, role });
  const token = response.data?.token;
  if (token) {
    setSessionToken(token);
    return token;
  }
  throw new Error('No API token returned by backend.');
}

export async function logoutFromApi() {
  try {
    await client.post('/api/auth/firebase/logout');
  } catch (_error) {
    // silent fail if session already expired
  }
}

export async function fetchClientMissions(params: Record<string, string | number | undefined>) {
  const response = await client.get('/api/missions', { params });
  return response.data?.data ?? [];
}

export async function fetchLinerMissions(params: Record<string, string | number | undefined>) {
  const response = await client.get('/api/liner/missions', { params });
  return response.data?.data ?? [];
}

export async function fetchMissionDetail(missionId: string) {
  const response = await client.get(`/api/missions/${missionId}`);
  return response.data?.data ?? response.data;
}

export async function fetchMissionChat(missionId: string, role: 'client' | 'liner') {
  const path = role === 'liner' ? `/api/liner/missions/${missionId}/chat` : `/api/missions/${missionId}/chat`;
  const response = await client.get(path);
  return response.data?.data ?? response.data ?? [];
}

export async function sendMissionChatMessage(
  missionId: string,
  role: 'client' | 'liner',
  payload: { body: string; attachments?: { url?: string; name?: string }[] },
) {
  const path = role === 'liner' ? `/api/liner/missions/${missionId}/chat` : `/api/missions/${missionId}/chat`;
  return client.post(path, payload);
}

export async function fetchClientWallet() {
  const response = await client.get('/api/client/wallet');
  return response.data;
}

export async function fetchLinerWallet() {
  const response = await client.get('/api/liner/wallet');
  return response.data;
}

export async function fetchNotifications() {
  const response = await client.get('/api/notifications');
  return response.data?.data ?? [];
}

export async function fetchPayoutAccounts() {
  const response = await client.get('/api/liner/payout-accounts');
  return response.data?.data ?? [];
}

export async function markNotification(notificationId: string) {
  return client.post(`/api/notifications/${notificationId}/read`);
}

export async function fetchKyc() {
  const response = await client.get('/api/liner/kyc');
  return response.data;
}

export async function toggleKycChecklist(id: string, completed: boolean) {
  const response = await client.patch(`/api/liner/kyc/checklist/${id}`, { completed });
  return response.data;
}

export async function submitKyc(status: string) {
  const response = await client.patch('/api/liner/kyc/submit', { status });
  return response.data;
}

export async function registerPushDevice(payload: { token: string; platform: string }) {
  return client.post('/api/push/register', payload);
}

export async function fetchCurrentUser() {
  const response = await client.get('/api/me');
  return response.data?.data ?? response.data;
}

export default client;
