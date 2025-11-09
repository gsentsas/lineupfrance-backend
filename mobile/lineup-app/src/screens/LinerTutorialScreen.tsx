import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SectionCard from '../components/SectionCard';
import { palette } from '../theme';

const slides = [
  { title: 'Accepter une mission', description: 'Choisissez vos missions et confirmez la réservation.' },
  { title: 'Envoyer vos preuves', description: 'Photos horodatées, QR et chat identiques à Flutter.' },
  { title: 'Débloquer le payout', description: 'Statut done → capture paiement puis wallet/payout.' },
];

export default function LinerTutorialScreen() {
  const [index, setIndex] = useState(0);
  const completed = useMemo(() => index >= slides.length, [index]);

  const next = () => {
    if (index < slides.length) {
      setIndex(i => i + 1);
    }
  };

  const reset = () => setIndex(0);

  const slide = slides[Math.min(index, slides.length - 1)];

  return (
    <View style={styles.container}>
      <SectionCard title="Tutoriel Liner" subtitle="Reproduction 1:1 du flow Flutter">
        <View style={styles.progress}>
          <Text style={styles.progressLabel}>Étape {Math.min(index + 1, slides.length)}/{slides.length}</Text>
          <View style={styles.track}>
            <View style={[styles.thumb, { width: `${(Math.min(index + 1, slides.length) / slides.length) * 100}%` }]} />
          </View>
        </View>
        <Text style={styles.title}>{completed ? 'Tutoriel terminé 🎉' : slide.title}</Text>
        <Text style={styles.description}>
          {completed ? 'Vous pouvez accepter votre première mission depuis la liste.' : slide.description}
        </Text>
        <View style={styles.row}>
          <Pressable style={styles.outline} onPress={reset}>
            <Text style={styles.outlineText}>Recommencer</Text>
          </Pressable>
          <Pressable style={styles.primary} onPress={next}>
            <Text style={styles.primaryText}>{completed ? 'Aller aux missions' : 'Étape suivante'}</Text>
          </Pressable>
        </View>
      </SectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 24,
  },
  progress: {
    marginBottom: 18,
  },
  progressLabel: {
    color: palette.muted,
    marginBottom: 6,
  },
  track: {
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.border,
  },
  thumb: {
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.secondary,
  },
  title: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    color: palette.muted,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  outline: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineText: {
    color: palette.text,
  },
  primary: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: palette.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
