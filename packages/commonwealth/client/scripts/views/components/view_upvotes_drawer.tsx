import Comment from 'client/scripts/models/Comment';
import type Thread from 'client/scripts/models/Thread';
import { useFetchProfilesByAddressesQuery } from 'client/scripts/state/api/profiles';
import React, { useState } from 'react';
import app from 'state';
import { CWText } from './component_kit/cw_text';
import CWDrawer from './component_kit/new_designs/CWDrawer';
import { CWTable } from './component_kit/new_designs/CWTable';

type ViewUpvotesDrawerProps = {
  contentType: 'thread' | 'comment';
  thread?: Thread;
  comment?: Comment<any>;
};

export const ViewUpvotesDrawer = ({
  contentType,
  thread,
  comment,
}: ViewUpvotesDrawerProps) => {
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState(false);
  const reactors = thread?.associatedReactions;
  const reactorAddresses = reactors?.map((t) => t.address);

  const { data: reactorProfiles } = useFetchProfilesByAddressesQuery({
    currentChainId: app.activeChainId(),
    profileAddresses: reactorAddresses,
    profileChainIds: [app.chain.id],
  });

  const reactorData = reactorProfiles?.map((profile) => {
    const reactor = reactors.find((addr) => addr.address === profile.address);

    return {
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      address: profile.address,
      updated_at: reactor?.updated_at,
      voting_weight: reactor?.voting_weight,
    };
  });

  const getColumnInfo = () => {
    return [
      {
        key: 'name',
        header: 'Name',
        numeric: false,
        sortable: true,
      },
      {
        key: 'voteWeight',
        header: 'Vote Weight',
        numeric: true,
        sortable: true,
      },
      {
        key: 'timestamp',
        header: 'Timestamp',
        numeric: true,
        sortable: true,
        chronological: true,
      },
    ];
  };

  const voterRow = (voter) => {
    return {
      name: voter.name,
      voteWeight: voter.voting_weight,
      timestamp: voter.updated_at,
      avatars: {
        name: {
          avatarUrl: voter.avatarUrl,
          address: voter.address,
        },
      },
    };
  };

  const getRowData = (voters) => {
    if (voters) {
      return voters?.map((voter) => {
        return voterRow(voter);
      });
    }
  };

  const getVoteWeightTotal = (voters) => {
    return voters.reduce((memo, current) => memo + current.voting_weight, 0);
  };

  return (
    <>
      <CWText type="caption" onClick={() => setIsUpvoteDrawerOpen(true)}>
        View Upvotes
      </CWText>
      <CWDrawer
        open={isUpvoteDrawerOpen}
        header={`${
          contentType.charAt(0).toLocaleUpperCase() + contentType.slice(1)
        } upvotes`}
        onClose={() => setIsUpvoteDrawerOpen(false)}
      >
        {reactorData && (
          <>
            <CWTable
              columnInfo={getColumnInfo()}
              rowData={getRowData(reactorData)}
            />
            <div className="upvote-totals">
              <div className="upvotes">
                <CWText type="caption" fontWeight="uppercase">
                  Upvotes
                </CWText>
                <CWText type="b2">{reactorData.length}</CWText>
              </div>
              <div className="weight">
                <CWText type="caption" fontWeight="uppercase">
                  Total
                </CWText>
                <CWText type="b2">{getVoteWeightTotal(reactorData)}</CWText>
              </div>
            </div>
          </>
        )}
      </CWDrawer>
    </>
  );
};
