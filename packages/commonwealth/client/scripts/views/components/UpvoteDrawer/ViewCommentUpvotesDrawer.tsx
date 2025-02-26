import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { DEFAULT_NAME } from '@hicommonwealth/shared';
import React, { Dispatch, SetStateAction } from 'react';
import app from 'state';
import { CommentViewParams } from '../../pages/discussions/CommentCard/CommentCard';
import { ViewUpvotesDrawer } from './ViewUpvotesDrawer';

type ViewCommentUpvotesDrawerProps = {
  comment?: CommentViewParams;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  weightType?: TopicWeightedVoting | null;
};

export const ViewCommentUpvotesDrawer = ({
  comment,
  isOpen,
  setIsOpen,
  weightType,
}: ViewCommentUpvotesDrawerProps) => {
  return (
    <ViewUpvotesDrawer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      header="Comment upvotes"
      reactorData={(comment?.reactions || [])?.map((reactor) => ({
        // TODO: fix type, they keys should be defined, if the array obj exists, no need to add fallbacks
        // but had to add to fix types here
        name: reactor.profile_name || DEFAULT_NAME,
        avatarUrl: reactor.avatar_url || '',
        address: reactor.address || '',
        updated_at: reactor.updated_at || '',
        voting_weight: reactor.calculated_voting_weight || 1,
      }))}
      // @ts-expect-error <StrictNullChecks/>
      author={
        comment?.address ? app.chain.accounts.get(comment?.address) : null
      }
      // @ts-expect-error <StrictNullChecks/>
      publishDate={(comment?.created_at as string) || ''} // TODO: fix type
      topicWeight={weightType}
    />
  );
};
