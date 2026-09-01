import { useState } from 'react';

export type UpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'applying' }
  | { status: 'up_to_date' }
  | { status: 'error'; message: string };

let UpdatesModule: typeof import('expo-updates') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  UpdatesModule = require('expo-updates');
} catch {
  UpdatesModule = null;
}

export function useOtaUpdate() {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });

  const check = async () => {
    if (!UpdatesModule || __DEV__) {
      setState({ status: 'up_to_date' });
      return;
    }
    try {
      setState({ status: 'checking' });
      const update = await UpdatesModule.checkForUpdateAsync();
      if (update.isAvailable) {
        setState({ status: 'available' });
      } else {
        setState({ status: 'up_to_date' });
      }
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Error al verificar actualizaciones',
      });
    }
  };

  const apply = async () => {
    if (!UpdatesModule) return;
    try {
      setState({ status: 'applying' });
      await UpdatesModule.fetchUpdateAsync();
      await UpdatesModule.reloadAsync();
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Error al aplicar actualización',
      });
    }
  };

  return { state, check, apply };
}
