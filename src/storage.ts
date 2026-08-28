import { browser } from 'wxt/browser';
import { EMPTY_STATE, type BridgeState } from './types';

const KEY = 'bridgeState';

export async function loadState(): Promise<BridgeState> {
  const result = await browser.storage.local.get(KEY);
  const value = result[KEY] as BridgeState | undefined;
  if (!value || value.version !== 1 || !Array.isArray(value.items)) return structuredClone(EMPTY_STATE);
  return value;
}

export async function saveState(state: BridgeState): Promise<void> {
  await browser.storage.local.set({ [KEY]: state });
}
