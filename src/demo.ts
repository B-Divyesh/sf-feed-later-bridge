import type { BridgeState, ReadingItem } from './types';

export const REAL_STORAGE_KEY = 'bridgeState';
export const DEMO_STORAGE_KEY = 'demo:bridgeState';

const DEMO_ITEMS: ReadingItem[] = [
  {
    id: 'demo-link-archives',
    url: 'https://reading.example.org/link-archives',
    title: 'How small link archives outlast services',
    author: 'Mara Bell',
    publishedAt: '2026-08-24T09:30:00.000Z',
    sourceTitle: 'Saved in Miniflux',
    status: 'queued',
    note: 'Compare the export choices before moving old saves.',
    savedAt: '2026-08-25T10:00:00.000Z',
    finishedAt: null
  },
  {
    id: 'demo-solar-web',
    url: 'https://reading.example.org/solar-web',
    title: 'A solar-powered website for a slower web',
    author: 'Rin Okafor',
    publishedAt: '2026-08-22T11:20:00.000Z',
    sourceTitle: 'Saved in Miniflux',
    status: 'queued',
    note: '',
    savedAt: '2026-08-25T10:00:00.000Z',
    finishedAt: null
  },
  {
    id: 'demo-migration-plan',
    url: 'https://reading.example.org/migration-plan',
    title: 'Making links durable across tools',
    author: 'Iris Chen',
    publishedAt: '2026-08-19T15:45:00.000Z',
    sourceTitle: 'Saved in Miniflux',
    status: 'finished',
    note: 'Keep the migration checklist.',
    savedAt: '2026-08-25T10:00:00.000Z',
    finishedAt: '2026-08-26T10:00:00.000Z'
  }
];

export function createDemoState(): BridgeState {
  return {
    version: 1,
    feedUrl: 'https://sample.feed-later-bridge.local/saved-items.xml',
    feedTitle: 'Saved in Miniflux',
    lastSyncAt: '2026-08-25T10:00:00.000Z',
    items: structuredClone(DEMO_ITEMS)
  };
}
