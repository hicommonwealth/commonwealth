import { useMemo } from 'react';
import { useDebounce } from 'usehooks-ts';

import { APIOrderBy, APIOrderDirection } from '../helpers/constants';
import { useSearchThreadsQuery } from '../state/api/threads';
import { useSearchCommentsQuery } from '../state/api/comments';
import { useSearchChainsQuery } from '../state/api/chains';
import { useSearchProfilesQuery } from '../state/api/profiles';
import { SearchScope } from '../models/SearchQuery';
import app from '../state';

const NUM_RESULTS_PER_SECTION = 2;

type Filter = 'threads' | 'replies' | 'communities' | 'members';

const useSearchResults = (
  searchTerm: string,
  filters: Filter[],
  resultsPerSection?: number
) => {
  const chainId = app.activeChainId() || 'all_chains';
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const sharedQueryOptions = {
    chainId,
    searchTerm: debouncedSearchTerm,
    limit: resultsPerSection ? resultsPerSection : NUM_RESULTS_PER_SECTION,
    orderBy: APIOrderBy.Rank,
    orderDirection: APIOrderDirection.Desc,
  };
  const queryEnabled = debouncedSearchTerm.length > 0;

  const { data: threadsData } = useSearchThreadsQuery({
    ...sharedQueryOptions,
    enabled: queryEnabled,
  });

  const { data: commentsData } = useSearchCommentsQuery({
    ...sharedQueryOptions,
    enabled: queryEnabled,
  });

  const { data: chainsData } = useSearchChainsQuery({
    ...sharedQueryOptions,
    enabled: queryEnabled,
  });

  const { data: profilesData } = useSearchProfilesQuery({
    ...sharedQueryOptions,
    includeRoles: false,
    enabled: queryEnabled,
  });

  const searchResults = useMemo(() => {
    return {
      [SearchScope.Threads]: filters.includes("threads") ? threadsData?.pages?.[0]?.results || [] : [],
      [SearchScope.Replies]: filters.includes("replies") ? commentsData?.pages?.[0]?.results || [] : [],
      [SearchScope.Communities]: filters.includes("communities") ? chainsData?.pages?.[0]?.results || [] : [],
      [SearchScope.Members]: filters.includes("members") ? profilesData?.pages?.[0]?.results || [] : [],
    };
  }, [threadsData, chainsData, profilesData, commentsData, filters]);

  return { searchResults };
};

export default useSearchResults;
