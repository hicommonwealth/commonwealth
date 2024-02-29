import Comment from 'client/scripts/models/Comment';
import React, { Dispatch, SetStateAction } from 'react';
import app from 'state';
import { ViewUpvotesDrawer } from './ViewUpvotesDrawer';

type ViewCommentUpvotesDrawerProps = {
  comment?: Comment<any>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const ViewCommentUpvotesDrawer = ({
  comment,
  isOpen,
  setIsOpen,
}: ViewCommentUpvotesDrawerProps) => {
  const reactors = comment?.reactions;
  const reactorData = reactors?.map((reactor) => {
    const reactorMiscData = reactors.find(
      (r) => r.author === reactor.profile.address,
    );

    return {
      name: reactor.profile.name,
      avatarUrl: reactor.profile.avatarUrl,
      address: reactor.profile.address,
      updated_at: reactorMiscData?.updatedAt,
      voting_weight: reactorMiscData?.calculatedVotingWeight || 1,
    };
  });

  return (
    <ViewUpvotesDrawer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      contentBody={comment.text}
      header="Comment upvotes"
      reactorData={reactorData}
      author={app.chain.accounts.get(comment.author)}
      publishDate={comment.createdAt}
    />
  );
};
