import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/lib/toast';
import { colors } from '@/lib/colors';
import { respaldarSiHaceFalta } from '@/features/backup/autoBackup';
import { spacing, type } from '@/lib/theme';
import { useDbMigrations, enableWalMode } from '@/db/migrate';
import { seedIfEmpty } from '@/db/seed';
import { useOtaUpdate } from '@/lib/updates';
import { Button } from '@/components/ui/Button';
import { initPin } from '@/features/auth/pinStore';
import { PinLockScreen } from '@/features/auth/PinLockModal';
import { syncAll } from '@/features/sync/cloudSync';

export default function RootLayout() {
  // Inicializar PIN y Auto-backup
  useEffect(() => {
    void initPin();
    void respaldarSiHaceFalta();
  }, []);

  const { success, error } = useDbMigrations();
  const [bootstrapped, setBootstrapped] = useState(false);
  const { state: updateState, apply: applyUpdate } = useOtaUpdate();

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    if (!success) return;
    (async () => {
      try {
        await enableWalMode();
        await seedIfEmpty();
        // Sincronizar con Supabase en background
        void syncAll();
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [success]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {error ? (
            <BootError message={error.message} />
          ) : !bootstrapped || !fontsLoaded ? (
            <BootLoading />
          ) : updateState.status === 'available' ||
            updateState.status === 'applying' ||
            updateState.status === 'error' ? (
            <UpdateGate
              applying={updateState.status === 'applying'}
              errorMessage={updateState.status === 'error' ? updateState.message : null}
              onApply={applyUpdate}
            />
          ) : (
            <>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="ajustes" />
              </Stack>
              <PinLockScreen />
            </>
          )}
          <Toaster />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function BootLoading() {
  return (
    <View style={bootStyles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={bootStyles.text}>Cargando Tay Préstamos… 💰</Text>
    </View>
  );
}

function BootError({ message }: { message: string }) {
  return (
    <View style={bootStyles.container}>
      <Text style={bootStyles.errorTitle}>Error al iniciar base de datos</Text>
      <Text style={bootStyles.errorMessage}>{message}</Text>
    </View>
  );
}

function UpdateGate({
  applying,
  errorMessage,
  onApply,
}: {
  applying: boolean;
  errorMessage: string | null;
  onApply: () => void;
}) {
  return (
    <View style={bootStyles.container}>
      <Text style={bootStyles.updateTitle}>Actualización disponible ✨</Text>
      <Text style={bootStyles.updateBody}>
        Hay mejoras listas para Tay Préstamos. Tus datos están completamente seguros.
      </Text>
      {errorMessage ? <Text style={bootStyles.errorMessage}>{errorMessage}</Text> : null}
      <Button onPress={onApply} loading={applying} fullWidth size="lg">
        Actualizar ahora
      </Button>
    </View>
  );
}

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[3],
    backgroundColor: colors.background,
  },
  text: { ...type.body, color: colors.inkMuted },
  errorTitle: { ...type.title, color: colors.danger, textAlign: 'center' },
  errorMessage: { ...type.body, color: colors.inkMuted, textAlign: 'center' },
  updateTitle: { ...type.title, color: colors.ink, textAlign: 'center' },
  updateBody: { ...type.body, color: colors.inkMuted, textAlign: 'center' },
});
