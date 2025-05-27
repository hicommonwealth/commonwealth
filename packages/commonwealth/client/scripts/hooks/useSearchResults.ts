import { useMemo } from 'react';
import { useDebounce } from 'usehooks-ts';

import {
  CommentSearchView,
  SearchCommunityView,
  SearchUserProfilesView,
  ThreadView,
} from '@hicommonwealth/schemas';
import { z } from 'zod';
import { APIOrderBy, APIOrderDirection } from '../helpers/constants';
import { SearchScope } from '../models/SearchQuery';
import app from '../state';
import { useSearchCommentsQuery } from '../state/api/comments';
import { useSearchCommunitiesQuery } from '../state/api/communities';
import { useSearchProfilesQuery } from '../state/api/profiles';
import { useSearchThreadsQuery } from '../state/api/threads';

export type SearchResults = {
  [SearchScope.Threads]: z.infer<typeof ThreadView>[];
  [SearchScope.Replies]: z.infer<typeof CommentSearchView>[];
  [SearchScope.Communities]: z.infer<typeof SearchCommunityView>[];
  [SearchScope.Members]: z.infer<typeof SearchUserProfilesView>[];
};

const NUM_RESULTS_PER_SECTION = 2;

type Filter = 'threads' | 'replies' | 'communities' | 'members';

const useSearchResults = (
  searchTerm: string,
  filters: Filter[],
  resultsPerSection?: number,
): {
  searchResults: SearchResults;
} => {
  const communityId = filters.includes('communities')
    ? 'all_communities'
    : app.activeChainId() || '';
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 500);

  const sharedQueryOptions = {
    communityId,
    searchTerm: debouncedSearchTerm,
    limit: resultsPerSection ? resultsPerSection : NUM_RESULTS_PER_SECTION,
    orderBy: APIOrderBy.Rank,
    orderDirection: APIOrderDirection.Desc,
  };
  const queryEnabled = debouncedSearchTerm.length > 0 && !!communityId;

  const { data: threadsData } = useSearchThreadsQuery({
    ...{
      community_id: sharedQueryOptions.communityId,
      search_term: sharedQueryOptions.searchTerm,
      cursor: 1,
      limit: sharedQueryOptions.limit,
      order_by: sharedQueryOptions.orderBy,
      order_direction: sharedQueryOptions.orderDirection,
      thread_title_only: false,
      include_count: false,
    },
    enabled: queryEnabled && filters.includes('threads'),
  });

  const { data: commentsData } = useSearchCommentsQuery({
    ...{
      community_id: sharedQueryOptions.communityId,
      search: sharedQueryOptions.searchTerm,
      cursor: 1,
      limit: sharedQueryOptions.limit,
      order_by: sharedQueryOptions.orderBy,
      order_direction: sharedQueryOptions.orderDirection,
    },
    enabled: queryEnabled && filters.includes('replies'),
  });

  const { data: communityData } = useSearchCommunitiesQuery({
    ...{
      search: sharedQueryOptions.searchTerm,
      cursor: 1,
      limit: sharedQueryOptions.limit,
      order_by: sharedQueryOptions.orderBy,
      order_direction: sharedQueryOptions.orderDirection,
    },
    enabled: queryEnabled && filters.includes('communities'),
  });

  const { data: profilesData } = useSearchProfilesQuery({
    ...sharedQueryOptions,
    enabled:
      queryEnabled &&
      filters.includes('members') &&
      debouncedSearchTerm?.length >= 3,
  });

  const searchResults = useMemo(() => {
    return {
      [SearchScope.Threads]: threadsData?.pages?.[0]?.results || [],
      [SearchScope.Replies]: commentsData?.pages?.[0]?.results || [],
      [SearchScope.Communities]: communityData?.pages?.[0]?.results || [],
      [SearchScope.Members]: profilesData?.pages?.[0]?.results || [],
    };
  }, [threadsData, communityData, profilesData, commentsData]);

  return { searchResults };
};

export default useSearchResults;
