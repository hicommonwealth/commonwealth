import Account from 'client/scripts/models/Account';
import AddressInfo from 'client/scripts/models/AddressInfo';
import MinimumProfile from 'client/scripts/models/MinimumProfile';
import React, { useState } from 'react';
import { AuthorAndPublishInfo } from '../pages/discussions/ThreadCard/AuthorAndPublishInfo';
import { CWText } from './component_kit/cw_text';
import CWDrawer from './component_kit/new_designs/CWDrawer';
import { CWTable } from './component_kit/new_designs/CWTable';
import { QuillRenderer } from './react_quill_editor/quill_renderer';

type ViewUpvotesDrawerProps = {
  header: string;
  reactorData: any[];
  contentBody: string;
  author: Account | AddressInfo | MinimumProfile;
  publishDate: moment.Moment;
};

export const ViewUpvotesDrawer = ({
  header,
  reactorData,
  contentBody,
  author,
  publishDate,
}: ViewUpvotesDrawerProps) => {
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState(false);

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

  const getAuthorCommunityId = (contentAuthor) => {
    if (contentAuthor instanceof MinimumProfile) {
      return contentAuthor?.chain;
    } else if (contentAuthor instanceof Account) {
      return contentAuthor.community.id;
    }
  };

  return (
    <>
      <CWText
        type="caption"
        className="drawer-trigger"
        onClick={() => setIsUpvoteDrawerOpen(true)}
      >
        View Upvotes
      </CWText>
      <CWDrawer
        open={isUpvoteDrawerOpen}
        header={header}
        onClose={() => setIsUpvoteDrawerOpen(false)}
      >
        <div className="upvoted-content">
          <div className="upvoted-content-header">
            <AuthorAndPublishInfo
              authorAddress={author?.address}
              authorChainId={getAuthorCommunityId(author)}
              publishDate={publishDate}
              showUserAddressWithInfo={false}
            />
          </div>
          <div className="upvoted-content-body">
            <QuillRenderer doc={contentBody} cutoffLines={10} />
          </div>
        </div>
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
