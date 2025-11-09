import { useNavigation } from '@react-navigation/native';
import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context/AuthProvider';

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#05060a',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
  },
  text: {
    fontSize: 15,
    color: '#cfd4ff',
    textAlign: 'center',
    marginTop: 8,
  },
});

export function withOpsGuard<P>(Wrapped: ComponentType<P>): ComponentType<P> {
  function Guarded(props: P) {
    const { isOps, profileLoading } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    useEffect(() => {
      if (!profileLoading && !isOps) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'RoleChoice' }],
        });
      }
    }, [isOps, profileLoading, navigation]);

    if (profileLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color="#ff7ac3" />
          <Text style={styles.text}>Chargement du profil Ops…</Text>
        </View>
      );
    }

    if (!isOps) {
      return (
        <View style={styles.center}>
          <Text style={styles.title}>Accès Ops requis</Text>
          <Text style={styles.text}>Connectez-vous avec un compte Ops/Admin pour consulter ces écrans.</Text>
        </View>
      );
    }

    return <Wrapped {...props} />;
  }

  return Guarded;
}
