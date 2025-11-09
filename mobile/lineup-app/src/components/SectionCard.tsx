import { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { palette } from '../theme';

interface Props extends PropsWithChildren {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function SectionCard({ title, subtitle, actions, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
  },
  subtitle: {
    color: palette.muted,
    marginTop: 4,
  },
  body: {
    gap: 8,
  },
});
