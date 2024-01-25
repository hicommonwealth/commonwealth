import Account from 'client/scripts/models/Account';
import AddressInfo from 'client/scripts/models/AddressInfo';
import MinimumProfile from 'client/scripts/models/MinimumProfile';
import React, { useState } from 'react';
import { AuthorAndPublishInfo } from '../../../pages/discussions/ThreadCard/AuthorAndPublishInfo';
import { CWText } from '../../component_kit/cw_text';
import CWDrawer from '../../component_kit/new_designs/CWDrawer';
import { CWTable } from '../../component_kit/new_designs/CWTable';
import { CWThreadAction } from '../../component_kit/new_designs/cw_thread_action';
import { QuillRenderer } from '../../react_quill_editor/quill_renderer';
import { getColumnInfo } from '../util';

import './ViewUpvotesDrawer.scss';

type ViewUpvotesDrawerProps = {
  header: string;
  reactorData: any[];
  contentBody: string;
  author: Account | AddressInfo | MinimumProfile;
  publishDate: moment.Moment;
};

type Upvoter = {
  name: string;
  avatarUrl: string;
  address: string;
  updated_at: string;
  voting_weight: number;
};

export const ViewUpvotesDrawer = ({
  header,
  reactorData,
  contentBody,
  author,
  publishDate,
}: ViewUpvotesDrawerProps) => {
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState(false);

  const voterRow = (voter: Upvoter) => {
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

  const getRowData = (voters: Upvoter[]) => {
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
    <div className="ViewUpvotesDrawer">
      <CWThreadAction
        label="View upvotes"
        action="view-upvotes"
        onClick={() => setIsUpvoteDrawerOpen(true)}
      />
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
        {reactorData?.length > 0 ? (
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
        ) : (
          <CWText className="empty-upvotes-container" type="b1">
            There are no upvotes to view.
          </CWText>
        )}
      </CWDrawer>
    </div>
  );
};
