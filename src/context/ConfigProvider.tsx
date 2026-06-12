import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppConfig } from '../lib/pricing/types';
import { seedConfig } from '../data/seedConfig';
import { saveConfig, seedConfigIfMissing, subscribeToConfig } from '../lib/services/configService';
import { useAuth } from './AuthProvider';

interface ConfigContextValue {
  config: AppConfig;
  loading: boolean;
  updateConfig: (next: AppConfig) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: seedConfig,
  loading: true,
  updateConfig: async () => {},
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [config, setConfig] = useState<AppConfig>(seedConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConfig(seedConfig);
      setLoading(false);
      return undefined;
    }

    seedConfigIfMissing().catch(console.error);
    return subscribeToConfig((next) => {
      setConfig(next);
      setLoading(false);
    });
  }, [user]);

  async function updateConfig(next: AppConfig) {
    await saveConfig(next);
    setConfig(next);
  }

  return (
    <ConfigContext.Provider value={{ config, loading, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
