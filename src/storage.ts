import { browser } from 'wxt/browser';
import { DEMO_STORAGE_KEY, REAL_STORAGE_KEY } from './demo';
import { EMPTY_STATE, type BridgeState } from './types';

export type StorageMode = 'real' | 'demo';

function keyFor(mode: StorageMode): string {
  return mode === 'demo' ? DEMO_STORAGE_KEY : REAL_STORAGE_KEY;
}

export async function loadState(mode: StorageMode = 'real'): Promise<BridgeState> {
  const key = keyFor(mode);
  const result = await browser.storage.local.get(key);
  const value = result[key] as BridgeState | undefined;
  if (!value || value.version !== 1 || !Array.isArray(value.items)) return structuredClone(EMPTY_STATE);
  return value;
}

export async function saveState(state: BridgeState, mode: StorageMode = 'real'): Promise<void> {
  await browser.storage.local.set({ [keyFor(mode)]: state });
}

export async function clearState(mode: StorageMode): Promise<void> {
  await browser.storage.local.remove(keyFor(mode));
}
