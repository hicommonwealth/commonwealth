import Account from 'client/scripts/models/Account';
import AddressInfo from 'client/scripts/models/AddressInfo';
import MinimumProfile from 'client/scripts/models/MinimumProfile';
import React, { Dispatch, SetStateAction } from 'react';
import { AuthorAndPublishInfo } from '../../../pages/discussions/ThreadCard/AuthorAndPublishInfo';
import { CWText } from '../../component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from '../../component_kit/new_designs/CWDrawer';
import { CWTable } from '../../component_kit/new_designs/CWTable';
import { QuillRenderer } from '../../react_quill_editor/quill_renderer';

import { APIOrderDirection } from 'client/scripts/helpers/constants';
import { CWTableColumnInfo } from '../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../component_kit/new_designs/CWTable/useCWTableState';
import './ViewUpvotesDrawer.scss';

type Profile = Account | AddressInfo | MinimumProfile;

type ViewUpvotesDrawerProps = {
  header: string;
  reactorData: any[];
  contentBody: string;
  author: Profile;
  publishDate: moment.Moment;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

type Upvoter = {
  name: string;
  avatarUrl: string;
  address: string;
  updated_at: string;
  voting_weight: number;
};

const columns: CWTableColumnInfo[] = [
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

export const ViewUpvotesDrawer = ({
  header,
  reactorData,
  contentBody,
  author,
  publishDate,
  isOpen,
  setIsOpen,
}: ViewUpvotesDrawerProps) => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'timestamp',
    initialSortDirection: APIOrderDirection.Desc,
  });

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

  const getVoteWeightTotal = (voters: Upvoter[]) => {
    return voters.reduce((memo, current) => memo + current.voting_weight, 0);
  };

  const getAuthorCommunityId = (contentAuthor: Profile) => {
    if (contentAuthor instanceof MinimumProfile) {
      return contentAuthor?.chain;
    } else if (contentAuthor instanceof Account) {
      return contentAuthor.community.id;
    }
  };

  const profile = author?.['profile']
    ? {
        avatarUrl: author['profile'].avatarUrl,
        lastActive: author['profile'].lastActive,
        id: author['profile'].id,
        address: author['profile'].address,
        name: author['profile'].name,
      }
    : null;

  return (
    <div className="ViewUpvotesDrawer">
      <CWDrawer
        overlayOpacity={0}
        className="upvote-drawer"
        open={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <CWDrawerTopBar onClose={() => setIsOpen(false)} />

        <div className="content-container">
          <CWText type="h3">{header}</CWText>
          <div className="upvoted-content">
            <div className="upvoted-content-header">
              <AuthorAndPublishInfo
                authorAddress={author?.address}
                authorCommunityId={getAuthorCommunityId(author)}
                publishDate={publishDate}
                showUserAddressWithInfo={false}
                profile={profile}
              />
            </div>
            <div className="upvoted-content-body">
              <QuillRenderer doc={contentBody} cutoffLines={10} />
            </div>
          </div>
          {reactorData?.length > 0 ? (
            <>
              <CWTable
                columnInfo={tableState.columns}
                sortingState={tableState.sorting}
                setSortingState={tableState.setSorting}
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
        </div>
      </CWDrawer>
    </div>
  );
};
