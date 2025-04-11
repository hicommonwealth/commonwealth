import type {
  FilteredThreadsFeedProps,
  SearchableThreadsFeedProps,
} from './types';

// Export types
export type { FilteredThreadsFeedProps, SearchableThreadsFeedProps };

// Note: We've moved the actual component implementations directly into tabConfig.tsx
// This file now only exports the types to avoid circular dependencies

export { SearchableThreadsFeed } from './SearchableThreadsFeed';
export * from './types';
