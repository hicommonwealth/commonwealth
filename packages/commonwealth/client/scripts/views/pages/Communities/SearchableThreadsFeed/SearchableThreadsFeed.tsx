import { Thread, ThreadView } from 'models/Thread';
import { ThreadKind, ThreadStage } from 'models/types'; // Uncomment imports
import React from 'react';
// import { useNavigate } from 'react-router-dom'; // Removed unused import
import { Virtuoso } from 'react-virtuoso';
import { ThreadResult } from 'views/pages/search/helpers';
// import { ThreadCard } from '../../discussions/ThreadCard'; // Removed unused import
import { safeScrollParent } from '../helpers'; // Assuming safeScrollParent is in helpers
import FeedFooter from './FeedFooter'; // Import the new component
import FeedItem from './FeedItem'; // Import the new FeedItem component
import './SearchableThreadsFeed.scss';

interface SearchableThreadsFeedProps {
  customScrollParent?: HTMLElement | null;
  // searchTerm: string; // Removed unused prop
  threads: ThreadResult[];
  isLoading: boolean;
  error: any;
  hasNextPage?: boolean;
  fetchNextPage: () => Promise<any>;
  isFetchingNextPage: boolean;
}

// Render function for Virtuoso itemContent - moved outside component scope
const renderFeedItem = (index: number, thread: Thread) => (
  <FeedItem index={index} thread={thread} />
);

// Render function for Virtuoso Footer component - moved outside component scope
const renderFeedFooter = (props: {
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
}) => (
  <FeedFooter
    isFetchingNextPage={props.isFetchingNextPage}
    hasNextPage={props.hasNextPage}
  />
);

const SearchableThreadsFeed = ({
  customScrollParent,
  // searchTerm, // Removed unused prop
  threads,
  isLoading,
  error,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: SearchableThreadsFeedProps) => {
  // const navigate = useNavigate(); // Removed unused variable

  const handleEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  if (isLoading && (!threads || threads.length === 0)) {
    return <div className="loading-spinner">Loading threads...</div>;
  }

  if (error) {
    return <div className="error-message">Error loading threads.</div>;
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="empty-state-message">
        No threads found matching your search.
      </div>
    );
  }

  // Map ThreadResult to Thread instances using ThreadView structure
  const mappedThreads = threads.map((threadData) => {
    // Create an object conforming to ThreadView + expected constructor extras
    const viewData: Partial<
      ThreadView & {
        /* constructor extras */
      }
    > = {
      id: threadData.id,
      title: threadData.title,
      body: threadData.body,
      created_at: threadData.created_at,
      community_id: threadData.community_id,
      // Provide defaults based on Thread constructor logic / ThreadView schema
      kind: ThreadKind.Discussion, // Default kind
      stage: ThreadStage.Discussion, // Default stage
      read_only: false,
      pinned: false,
      has_poll: false,
      view_count: 1,
      comment_count: 0,
      reaction_count: 0,
      reaction_weights_sum: '0',
      url: '',
      content_url: null,
      search: '',
      // Construct the Address object expected by the constructor
      Address: {
        address: threadData.address,
        community_id: threadData.address_community_id,
        id: threadData.address_id,
        // Minimal User/Profile structure (assuming no name/avatar from ThreadResult)
        User: {
          id: threadData.address_user_id,
          profile: { name: 'User' },
        },
      },
      // Ensure other potentially required fields from ThreadView have defaults
      updated_at: threadData.created_at, // Default updated_at to created_at
      // Default other nullable/optional fields from ThreadView schema if needed
      // e.g., reactions: [], associatedContests: [], etc.
      reactions: [],
      collaborators: [],
      associatedContests: [],
      topic: undefined,
      topic_id: undefined,
      is_linking_token: false,
      launchpad_token_address: null,
      ContestActions: [],
      Comments: [],
      ThreadVersionHistories: [],
      links: [],
      discord_meta: null,
    };

    // Cast to the type expected by the constructor
    return new Thread(
      viewData as ThreadView & {
        /* constructor extras */
      },
    );
  });

  return (
    <div className="Feed">
      <Virtuoso
        overscan={20}
        customScrollParent={safeScrollParent(customScrollParent)}
        totalCount={mappedThreads.length}
        data={mappedThreads}
        style={{ height: '100%' }}
        itemContent={renderFeedItem}
        endReached={handleEndReached}
        components={{
          Footer: () => renderFeedFooter({ isFetchingNextPage, hasNextPage }), // Use the render function
        }}
      />
    </div>
  );
};

SearchableThreadsFeed.displayName = 'SearchableThreadsFeed';

export default SearchableThreadsFeed;
