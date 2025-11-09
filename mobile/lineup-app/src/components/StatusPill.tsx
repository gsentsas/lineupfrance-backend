import { Text, View, StyleSheet } from 'react-native';
import { palette } from '../theme';

interface Props {
  label: string;
  variant?: 'primary' | 'ghost' | 'warning';
}

export default function StatusPill({ label, variant = 'primary' }: Props) {
  return (
    <View style={[styles.pill, styles[variant]]}>
      <Text style={[styles.text, variant === 'ghost' && styles.textGhost]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  primary: {
    backgroundColor: palette.primary,
  },
  ghost: {
    borderWidth: 1,
    borderColor: palette.border,
  },
  warning: {
    backgroundColor: 'rgba(255, 179, 71, 0.2)',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textGhost: {
    color: palette.text,
  },
});
