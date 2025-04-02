export interface ThreadItem {
  id: string;
  label: string;
}

export interface ModelItem {
  id: string;
  label: string;
}

export const MODELS: ModelItem[] = [
  { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-opus', label: 'Claude 3 Opus' },
  { id: 'claude', label: 'Claude' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gemini-pro', label: 'Gemini Pro' },
];

export const THREADS: ThreadItem[] = [
  {
    id: 'thread-1',
    label: 'Thread 1',
  },
  { id: 'thread-2', label: 'Thread 2' },
  { id: 'thread-3', label: 'Thread 3' },
];

export const MENTION_ITEMS = [
  ...THREADS.map((thread) => ({
    id: thread.id,
    name: thread.label,
    type: 'thread' as const,
  })),
  ...MODELS.map((model) => ({
    id: model.id,
    name: model.label,
    type: 'model' as const,
  })),
];
