import client from './api';
import * as FileSystem from 'expo-file-system';

type Asset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export async function uploadMissionEvidence(missionId: string, asset: Asset, role: 'client' | 'liner' = 'liner') {
  if (!asset?.uri) {
    throw new Error('Aucun fichier sélectionné');
  }

  const missionPath = role === 'liner' ? `/api/liner/missions/${missionId}/chat` : `/api/missions/${missionId}/chat`;
  const fileInfo = await FileSystem.getInfoAsync(asset.uri);
  if (!fileInfo.exists) {
    throw new Error('Fichier introuvable sur le périphérique');
  }

  const form = new FormData();
  form.append('attachments[]', {
    uri: asset.uri,
    name: asset.fileName ?? `evidence-${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  } as any);
  form.append('body', 'Preuve envoyée depuis Expo');

  return client.post(missionPath, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
