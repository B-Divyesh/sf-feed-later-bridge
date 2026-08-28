export type ItemStatus = 'queued' | 'finished';

export interface ReadingItem {
  id: string;
  url: string;
  title: string;
  author: string;
  publishedAt: string | null;
  sourceTitle: string;
  status: ItemStatus;
  note: string;
  savedAt: string;
  finishedAt: string | null;
}

export interface BridgeState {
  version: 1;
  feedUrl: string;
  feedTitle: string;
  lastSyncAt: string | null;
  items: ReadingItem[];
}

export interface ParsedFeed {
  title: string;
  items: Array<Omit<ReadingItem, 'status' | 'note' | 'savedAt' | 'finishedAt'>>;
}

export const EMPTY_STATE: BridgeState = {
  version: 1,
  feedUrl: '',
  feedTitle: '',
  lastSyncAt: null,
  items: []
};
