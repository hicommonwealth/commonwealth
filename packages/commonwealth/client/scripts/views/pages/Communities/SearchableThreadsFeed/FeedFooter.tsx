import React from 'react';

// Define the Footer component separately
interface FeedFooterProps {
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
}

const FeedFooter: React.FC<FeedFooterProps> = ({
  isFetchingNextPage,
  hasNextPage,
}) => {
  if (isFetchingNextPage) {
    return <div className="loading-spinner small">Loading more threads...</div>;
  }
  if (!hasNextPage) {
    return <div className="end-of-feed-message">End of results</div>;
  }
  return null;
};

export default FeedFooter;
