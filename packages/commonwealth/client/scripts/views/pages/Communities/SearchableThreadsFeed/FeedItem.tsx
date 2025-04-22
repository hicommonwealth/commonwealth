import { Thread } from 'models/Thread';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreadCard } from '../../discussions/ThreadCard';

// Placeholder slugify function (replace with actual import if available)
const slugify = (str: string | undefined): string =>
  str
    ? str
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
    : '';

interface FeedItemProps {
  index: number;
  thread: Thread;
}

const FeedItem: React.FC<FeedItemProps> = ({ index, thread }) => {
  const navigate = useNavigate();

  const communitySlug = thread.communityId
    ? slugify(thread.communityId)
    : 'unknown';
  const discussionLink = `/${communitySlug}/discussion/${thread.id}-${slugify(thread.title)}`;

  return (
    <ThreadCard
      key={index} // Key is usually handled by the list component, but good practice here
      thread={thread}
      layoutType="community-first"
      hideReactionButton
      hideUpvotesDrawer
      threadHref={discussionLink}
      onCommentBtnClick={() => navigate(`${discussionLink}?focusComments=true`)}
    />
  );
};

export default FeedItem;
