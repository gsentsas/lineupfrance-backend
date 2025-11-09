import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PushRegistrationState } from '../hooks/usePushRegistration';
import { palette } from '../theme';

type Props = {
  state: PushRegistrationState;
  role?: 'client' | 'liner' | 'ops';
};

type BannerVariant = 'success' | 'warning' | 'error' | 'muted';

type BannerDescriptor = {
  title: string;
  description?: string;
  variant: BannerVariant;
};

const variantStyles = StyleSheet.create({
  success: {
    borderColor: palette.success,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  warning: {
    borderColor: palette.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  error: {
    borderColor: palette.danger,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  muted: {
    borderColor: palette.border,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});

function describeState(state: PushRegistrationState, role?: Props['role']): BannerDescriptor {
  const context = role === 'liner' ? 'missions' : role === 'ops' ? 'incidents' : 'missions';
  switch (state.status) {
    case 'success': {
      const suffix = state.token ? `Device ID: ${state.token.slice(0, 6)}…` : undefined;
      return {
        title: 'Notifications push actives.',
        description: suffix,
        variant: 'success',
      };
    }
    case 'registering':
      return {
        title: 'Activation push en cours…',
        description: 'Merci de laisser l’application ouverte quelques secondes.',
        variant: 'warning',
      };
    case 'error':
      return {
        title: 'Activation push impossible.',
        description: state.error ?? 'Vérifiez les autorisations de notifications.',
        variant: 'error',
      };
    default:
      return {
        title: 'Notifications en attente.',
        description: `Connectez-vous et autorisez LineUp pour recevoir les alertes ${context}.`,
        variant: 'muted',
      };
  }
}

function PushStatusBannerComponent({ state, role }: Props) {
  const descriptor = useMemo(() => describeState(state, role), [state, role]);
  return (
    <View style={[styles.banner, variantStyles[descriptor.variant]]}>
      <Text style={styles.title}>{descriptor.title}</Text>
      {descriptor.description ? <Text style={styles.description}>{descriptor.description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  title: {
    color: palette.text,
    fontWeight: '600',
  },
  description: {
    color: palette.muted,
    marginTop: 4,
  },
});

const PushStatusBanner = memo(PushStatusBannerComponent);
export default PushStatusBanner;
