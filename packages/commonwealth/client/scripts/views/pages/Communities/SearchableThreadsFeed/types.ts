/**
 * Shared types for the thread feed components
 */

/**
 * Props for SearchableThreadsFeed component
 */
export interface SearchableThreadsFeedProps {
  /** Community ID to filter threads by */
  communityId?: string;
  /** Sort option for threads */
  sortOption?: string;
  /** Custom scroll parent for virtualized lists */
  customScrollParent?: HTMLElement | null;
  /** Search term to filter threads by */
  searchTerm: string;
}

/**
 * Props for FilteredThreadsFeed component
 */
export interface FilteredThreadsFeedProps {
  /** Community ID to filter threads by */
  communityId?: string;
  /** Sort option for threads */
  sortOption?: string;
  /** Custom scroll parent for virtualized lists */
  customScrollParent?: HTMLElement | null;
  /** Key to force refresh the component */
  filterKey?: number;
  /** Search term to filter threads by */
  searchTerm?: string;
}
