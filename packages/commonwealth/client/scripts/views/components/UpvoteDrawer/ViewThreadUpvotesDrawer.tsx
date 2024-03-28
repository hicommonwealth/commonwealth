import type Thread from 'client/scripts/models/Thread';
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
      voting_weight: reactor?.voting_weight || 1,
    };
  });

  return (
    <ViewUpvotesDrawer
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      contentBody={thread.body}
      header="Thread upvotes"
      reactorData={reactorData}
      author={app.chain.accounts.get(thread.author)}
      publishDate={thread.createdAt}
    />
  );
};
