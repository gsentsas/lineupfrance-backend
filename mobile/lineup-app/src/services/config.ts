import axios from 'axios';
import Constants from 'expo-constants';

const baseURL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export async function fetchRemoteSettings() {
  const response = await axios.get(`${baseURL}/api/settings`, { withCredentials: true });
  return response.data?.data ?? {};
}
