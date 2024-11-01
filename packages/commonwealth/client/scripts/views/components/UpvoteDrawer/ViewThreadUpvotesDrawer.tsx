import type Thread from 'models/Thread';
import React, { Dispatch, SetStateAction } from 'react';
import app from 'state';
import { ViewUpvotesDrawer } from './ViewUpvotesDrawer';

type ViewThreadUpvotesDrawerProps = {
  thread?: Thread;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const ViewThreadUpvotesDrawer = ({
  thread,
  isOpen,
  setIsOpen,
}: ViewThreadUpvotesDrawerProps) => {
  if (!thread) return null;
  const reactors = thread?.associatedReactions;

  const reactorData = reactors?.map((profile) => {
    const reactor = reactors.find((r) => r.address === profile.address);

    return {
      name: profile.profile_name,
      avatarUrl: profile.avatar_url,
      address: profile.address,
      updated_at: reactor?.updated_at,
      voting_weight: reactor?.calculated_voting_weight || 1,
    };
  });

  return (
    <ViewUpvotesDrawer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      header="Thread upvotes"
      reactorData={reactorData}
      // @ts-expect-error <StrictNullChecks/>
      author={
        thread?.author && app?.chain?.accounts
          ? app.chain.accounts.get(thread?.author)
          : null
      }
      publishDate={thread.createdAt}
    />
  );
};
