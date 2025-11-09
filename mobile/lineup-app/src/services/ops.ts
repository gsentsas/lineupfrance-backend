import client from './api';

export async function fetchOpsOverview() {
  const response = await client.get('/api/admin/overview');
  return response.data?.data ?? response.data;
}

export async function fetchOpsMissions() {
  const response = await client.get('/api/admin/missions', { params: { perPage: 10 } });
  return response.data?.data ?? [];
}

export async function fetchOpsNotifications() {
  const response = await client.get('/api/admin/notifications');
  return response.data?.data ?? [];
}

export async function fetchOpsActiveLiners() {
  const response = await client.get('/api/admin/liners/locations');
  return response.data?.data ?? response.data ?? [];
}

export async function fetchOpsAnnouncements() {
  const response = await client.get('/api/admin/announcements');
  return response.data?.data ?? [];
}

export async function publishOpsAnnouncement(body: { title: string; body: string }) {
  const response = await client.post('/api/admin/announcements', body);
  return response.data?.data ?? response.data;
}

export async function triggerOpsQuickAction(endpoint: string, payload?: Record<string, unknown>) {
  const response = await client.post(endpoint, payload);
  return response.data;
}
