import { slugify } from '@hicommonwealth/shared';
import { Thread } from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ThreadCard } from '../../discussions/ThreadCard';
import { UserDashboardRowSkeleton } from '../../user_dashboard/user_dashboard_row';
import { safeScrollParent } from '../helpers'; // Assuming safeScrollParent is in helpers
import './SearchableThreadsFeed.scss';

interface SearchableThreadsFeedProps {
  customScrollParent?: HTMLElement | null;
  searchTerm: string;
  threads: Thread[];
  isLoading: boolean;
  error: any; // Consider using a more specific error type if available
  hasNextPage?: boolean;
  fetchNextPage: () => Promise<any>; // Adjust return type if needed
  isFetchingNextPage: boolean;
}

// eslint-disable-next-line react/no-multi-comp
const SearchableThreadsFeed = ({
  customScrollParent,
  searchTerm,
  threads,
  isLoading,
  error,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: SearchableThreadsFeedProps) => {
  const navigate = useCommonNavigate();

  const handleEndReached = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="Feed">
        <div className="error-threads">Error loading threads</div>
      </div>
    );
  }

  if (threads.length === 0 && searchTerm) {
    return (
      <div className="Feed">
        <div className="no-feed-message">
          No threads found for &quot;{searchTerm}&quot;
        </div>
      </div>
    );
  } else if (threads.length === 0) {
    return (
      <div className="Feed">
        <div className="no-feed-message">No threads found.</div>
      </div>
    );
  }

  const mappedThreads = threads;

  return (
    <div className="Feed">
      <Virtuoso
        overscan={20}
        customScrollParent={safeScrollParent(customScrollParent)}
        totalCount={mappedThreads.length}
        data={mappedThreads}
        style={{ height: '100%' }}
        itemContent={(index, thread) => {
          const safeThread = new Thread(thread);
          const communitySlug = safeThread.communityId
            ? slugify(safeThread.communityId)
            : 'unknown';
          const discussionLink = `/${communitySlug}/discussion/${safeThread.id}-${slugify(safeThread.title)}`;

          return (
            <ThreadCard
              key={index}
              thread={safeThread}
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
            isFetchingNextPage ? (
              <div className="loading-spinner small">
                Loading more threads...
              </div>
            ) : hasNextPage ? null : (
              <div className="end-of-feed-message">End of results</div>
            ),
        }}
      />
    </div>
  );
};

SearchableThreadsFeed.displayName = 'SearchableThreadsFeed';

export default SearchableThreadsFeed;
