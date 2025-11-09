import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SectionCard from '../components/SectionCard';
import StatusPill from '../components/StatusPill';
import { palette } from '../theme';
import { fetchLinerMissions } from '../services/api';
import type { MissionSummary } from '../types';
import type { RootStackParamList } from '../types/navigation';
import { uploadMissionEvidence } from '../services/uploads';

const ASSIGNMENT = {
  all: 'Toutes',
  mine: 'Attribuées',
  open: 'Ouvertes',
};

type AssignmentKey = keyof typeof ASSIGNMENT;

export default function LinerMissionsScreen() {
  const [assignment, setAssignment] = useState<AssignmentKey>('all');
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchLinerMissions({ assigned: assignment, limit: 20 });
      setMissions(data);
    } catch (_error) {
      setError('Connexion requise côté liner.');
    } finally {
      setLoading(false);
    }
  }, [assignment]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUploadProof = async (missionId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Autorisation requise', 'Accordez l’accès aux photos pour envoyer une preuve.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) {
      return;
    }
    try {
      await uploadMissionEvidence(missionId, result.assets[0], 'liner');
      Alert.alert('Preuve envoyée', 'Votre preuve a été ajoutée au chat de mission.');
    } catch (_error) {
      Alert.alert('Erreur', "Impossible d'envoyer la preuve. Essayez à nouveau.");
    }
  };

  return (
    <View style={styles.container}>
      <SectionCard
        title="Missions liner"
        subtitle="Filtres assignment et progress"
        actions={
          <View style={styles.row}>
            {Object.entries(ASSIGNMENT).map(([key, label]) => (
              <Pressable
                key={key}
                style={[styles.pill, assignment === key && styles.pillActive]}
                onPress={() => setAssignment(key as AssignmentKey)}
              >
                <Text style={[styles.pillText, assignment === key && styles.pillTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        }
      >
        {loading ? (
          <ActivityIndicator color={palette.primary} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <FlatList
            data={missions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Mission
                mission={item}
                onUpload={handleUploadProof}
                onFollow={() =>
                  navigation.navigate('MissionDetail', {
                    missionId: item.id,
                    role: 'liner',
                    title: item.title,
                  })
                }
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SectionCard>
    </View>
  );
}

function Mission({
  mission,
  onUpload,
  onFollow,
}: {
  mission: MissionSummary;
  onUpload?: (missionId: string) => void;
  onFollow: () => void;
}) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>{mission.title}</Text>
        <StatusPill label={mission.status} />
      </View>
      <Text style={styles.meta}>{mission.client?.name ?? 'Client'} — {mission.location?.label ?? 'Lieu secret'}</Text>
      {mission.progressStatus ? <StatusPill label={mission.progressStatus} variant="ghost" /> : null}
      <View style={styles.buttonColumn}>
        <Pressable style={styles.followButton} onPress={onFollow}>
          <Text style={styles.followButtonText}>Suivre & chat</Text>
        </Pressable>
        <Pressable style={styles.uploadButton} onPress={() => onUpload?.(mission.id)}>
          <Text style={styles.uploadButtonText}>Envoyer une preuve</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: palette.secondary,
    borderColor: 'transparent',
  },
  pillText: {
    color: palette.muted,
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#ff9ea8',
  },
  separator: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 16,
  },
  meta: {
    color: palette.muted,
    marginTop: 4,
    marginBottom: 6,
  },
  buttonColumn: {
    marginTop: 10,
    gap: 10,
  },
  followButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadButton: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: palette.text,
    fontWeight: '600',
  },
});
