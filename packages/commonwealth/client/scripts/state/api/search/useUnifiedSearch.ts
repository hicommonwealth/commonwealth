import { useQuery } from '@tanstack/react-query';
import { trpc } from 'utils/trpcClient';
import { MENTION_CONFIG } from '../../../views/components/react_quill_editor/mention-config';

interface UseUnifiedSearchProps {
  searchTerm: string;
  communityId?: string;
  searchScope?: string[];
  limit?: number;
  enabled?: boolean;
  orderBy?: 'relevance' | 'created_at' | 'name';
  orderDirection?: 'ASC' | 'DESC';
}

export const useUnifiedSearch = ({
  searchTerm,
  communityId,
  searchScope = ['All'],
  limit = MENTION_CONFIG.MAX_SEARCH_RESULTS,
  enabled = true,
  orderBy = 'relevance',
  orderDirection = 'DESC',
}: UseUnifiedSearchProps) => {
  // Convert searchScope array to comma-separated string for API compatibility
  const searchScopeString = searchScope.join(',');

  return useQuery({
    queryKey: [
      'unifiedSearch',
      searchTerm,
      communityId,
      searchScopeString,
      limit,
      orderBy,
      orderDirection,
    ],
    queryFn: () =>
      trpc.search.searchEntities.query({
        searchTerm,
        communityId,
        searchScope: searchScopeString,
        limit,
        page: 1,
        orderBy,
        orderDirection,
        includeCount: false,
      }),
    enabled: enabled && searchTerm.length >= MENTION_CONFIG.MIN_SEARCH_LENGTH,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
