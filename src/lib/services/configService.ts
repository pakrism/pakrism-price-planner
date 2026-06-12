import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { seedConfig } from '../../data/seedConfig';
import type { AppConfig } from '../pricing/types';

const CONFIG_REF = doc(db, 'pricePlanner', 'config');

export async function loadConfig(): Promise<AppConfig> {
  const snap = await getDoc(CONFIG_REF);
  if (!snap.exists()) {
    await setDoc(CONFIG_REF, seedConfig);
    return seedConfig;
  }
  return { ...seedConfig, ...snap.data() } as AppConfig;
}

export function subscribeToConfig(callback: (config: AppConfig) => void): () => void {
  return onSnapshot(CONFIG_REF, (snap) => {
    if (!snap.exists()) {
      callback(seedConfig);
      return;
    }
    callback({ ...seedConfig, ...snap.data() } as AppConfig);
  });
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await setDoc(CONFIG_REF, config);
}

export async function seedConfigIfMissing(): Promise<void> {
  const snap = await getDoc(CONFIG_REF);
  if (!snap.exists()) {
    await setDoc(CONFIG_REF, seedConfig);
  }
}
