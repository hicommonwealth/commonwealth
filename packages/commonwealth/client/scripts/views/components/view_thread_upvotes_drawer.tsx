import type Thread from 'client/scripts/models/Thread';
import { useFetchProfilesByAddressesQuery } from 'client/scripts/state/api/profiles';
import React from 'react';
import app from 'state';
import { ViewUpvotesDrawer } from './view_upvotes_drawer';

type ViewThreadUpvotesDrawerProps = {
  thread?: Thread;
};

export const ViewThreadUpvotesDrawer = ({
  thread,
}: ViewThreadUpvotesDrawerProps) => {
  const reactors = thread?.associatedReactions;
  const reactorAddresses = reactors?.map((t) => t.address);

  const { data: reactorProfiles } = useFetchProfilesByAddressesQuery({
    currentChainId: app.activeChainId(),
    profileAddresses: reactorAddresses,
    profileChainIds: [app.chain.id],
  });

  const reactorData = reactorProfiles?.map((profile) => {
    const reactor = reactors.find((r) => r.address === profile.address);

    return {
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      address: profile.address,
      updated_at: reactor?.updated_at,
      voting_weight: reactor?.voting_weight || 0,
    };
  });

  return (
    <ViewUpvotesDrawer
      contentBody={thread.body}
      header="Thread upvotes"
      reactorData={reactorData}
      author={app.chain.accounts.get(thread.author)}
      publishDate={thread.createdAt}
    />
  );
};
