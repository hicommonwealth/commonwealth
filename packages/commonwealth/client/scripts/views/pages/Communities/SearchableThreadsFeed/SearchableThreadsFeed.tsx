import { ALL_COMMUNITIES, slugify } from '@hicommonwealth/shared';
import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import { Thread } from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import useSearchThreadsQuery from 'state/api/threads/searchThreads';
import { ThreadCard } from '../../discussions/ThreadCard';
import { UserDashboardRowSkeleton } from '../../user_dashboard/user_dashboard_row';
import { safeScrollParent } from '../helpers'; // Assuming safeScrollParent is in helpers
import './SearchableThreadsFeed.scss';

interface SearchableThreadsFeedProps {
  communityId?: string;
  sortOption?: string;
  customScrollParent?: HTMLElement | null;
  searchTerm: string;
}

export const SearchableThreadsFeed = React.memo(
  ({
    communityId,
    sortOption,
    customScrollParent,
    searchTerm,
  }: SearchableThreadsFeedProps) => {
    const [loadingMore, setLoadingMore] = useState(false);
    const navigate = useCommonNavigate();

    // Map the sort option to API values
    const orderBy =
      sortOption === 'upvotes' ? APIOrderBy.Rank : APIOrderBy.CreatedAt;
    const orderDirection = APIOrderDirection.Desc;

    // Fetch threads with search - always call this hook regardless of search term
    const searchResults = useSearchThreadsQuery({
      communityId: communityId || ALL_COMMUNITIES,
      searchTerm,
      limit: 20,
      orderBy,
      orderDirection,
      threadTitleOnly: false,
      includeCount: true,
    });

    // Handle end reached for pagination
    const handleEndReached = async () => {
      if (searchResults.hasNextPage && !loadingMore) {
        setLoadingMore(true);
        await searchResults.fetchNextPage();
        setLoadingMore(false);
      }
    };

    // Early returns for loading, error, and empty states
    if (searchResults.isLoading) {
      return (
        <div className="Feed">
          <Virtuoso
            customScrollParent={safeScrollParent(customScrollParent)}
            totalCount={4}
            style={{ height: '100%' }}
            itemContent={(i) => <UserDashboardRowSkeleton key={i} />}
          />
        </div>
      );
    }

    if (searchResults.error) {
      return (
        <div className="Feed">
          <div className="error-threads">Error loading threads</div>
        </div>
      );
    }

    const threads =
      searchResults.data?.pages.flatMap((page) => page.results) || [];

    if (threads.length === 0) {
      return (
        <div className="Feed">
          <div className="no-feed-message">
            No threads found for "{searchTerm}"
          </div>
        </div>
      );
    }

    // Map the search results to thread objects for ThreadCard component
    const mappedThreads = threads.map((thread) => {
      return new Thread({
        Address: {
          id: thread.address_id || 0,
          address: thread.address || '',
          community_id: thread.community_id,
          ghost_address: false,
          is_user_default: false,
          is_banned: false,
          role: 'member',
        },
        title: thread.title,
        id: thread.id,
        created_at: thread.created_at,
        updated_at: thread.created_at,
        topic: undefined, // Using undefined since topic may not be in the search results
        kind: 'discussion', // Default to discussion type
        stage: 'discussion', // Default to discussion stage
        ThreadVersionHistories: [],
        community_id: thread.community_id,
        read_only: false,
        body: thread.body,
        content_url: null,
        locked_at: '',
        archived_at: '',
        has_poll: false,
        marked_as_spam_at: '',
        discord_meta: null,
        profile_name: '',
        avatar_url: '',
        user_id: 0,
        user_tier: undefined,
        userId: 0,
        last_edited: thread.created_at,
        last_commented_on: '',
        reaction_weights_sum: '0',
        address_last_active: '',
        address_id: thread.address_id || 0,
        search: '',
        ContestActions: [],
        numberOfComments: 0, // Default to 0 since ThreadResult doesn't have number_of_comments
        is_linking_token: false,
        launchpad_token_address: undefined,
      });
    });

    return (
      <div className="Feed">
        <Virtuoso
          overscan={20}
          customScrollParent={safeScrollParent(customScrollParent)}
          totalCount={mappedThreads.length}
          data={mappedThreads}
          style={{ height: '100%' }}
          itemContent={(index, thread) => {
            const discussionLink = `/${thread.communityId}/discussion/${thread.id}-${slugify(thread.title)}`;

            return (
              <ThreadCard
                key={index}
                thread={thread}
                layoutType="community-first"
                hideReactionButton
                hideUpvotesDrawer
                threadHref={discussionLink}
                onCommentBtnClick={() =>
                  navigate(`${discussionLink}?focusComments=true`)
                }
              />
            );
          }}
          endReached={handleEndReached}
          components={{
            Footer: () =>
              searchResults.isFetchingNextPage ? (
                <div className="loading-spinner small">
                  Loading more threads...
                </div>
              ) : null,
          }}
        />
      </div>
    );
  },
);
