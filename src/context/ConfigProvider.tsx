import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppConfig } from '../lib/pricing/types';
import { seedConfig } from '../data/seedConfig';
import { saveConfig, seedConfigIfMissing, subscribeToConfig } from '../lib/services/configService';
import { useAuth } from './AuthProvider';

interface ConfigContextValue {
  config: AppConfig;
  loading: boolean;
  usingLocalDefaults: boolean;
  updateConfig: (next: AppConfig) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: seedConfig,
  loading: true,
  usingLocalDefaults: false,
  updateConfig: async () => {},
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { user, isAdminUser } = useAuth();
  const [config, setConfig] = useState<AppConfig>(seedConfig);
  const [loading, setLoading] = useState(true);
  const [usingLocalDefaults, setUsingLocalDefaults] = useState(false);

  useEffect(() => {
    if (!user) {
      setConfig(seedConfig);
      setUsingLocalDefaults(false);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    return subscribeToConfig(
      (next) => {
        setConfig(next);
        setUsingLocalDefaults(false);
        setLoading(false);
        if (isAdminUser) {
          seedConfigIfMissing().catch((error) => {
            console.warn('Could not seed price planner config:', error);
          });
        }
      },
      () => {
        setConfig(seedConfig);
        setUsingLocalDefaults(true);
        setLoading(false);
      },
    );
  }, [user]);

  async function updateConfig(next: AppConfig) {
    await saveConfig(next);
    setConfig(next);
    setUsingLocalDefaults(false);
  }

  return (
    <ConfigContext.Provider value={{ config, loading, usingLocalDefaults, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
