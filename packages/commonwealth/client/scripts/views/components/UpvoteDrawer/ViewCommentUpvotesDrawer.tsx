import Comment from 'models/Comment';
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
      (r) => r.author === reactor?.profile?.address,
    );

    return {
      name: reactor.profile?.name,
      avatarUrl: reactor.profile?.avatarUrl,
      address: reactor.profile?.address,
      updated_at: reactorMiscData?.updatedAt,
      voting_weight: reactorMiscData?.calculatedVotingWeight || 1,
    };
  });

  return (
    <ViewUpvotesDrawer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      header="Comment upvotes"
      // @ts-expect-error <StrictNullChecks/>
      reactorData={reactorData}
      // @ts-expect-error <StrictNullChecks/>
      author={comment?.author ? app.chain.accounts.get(comment?.author) : null}
      // @ts-expect-error <StrictNullChecks/>
      publishDate={comment.createdAt}
    />
  );
};
