import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { APIOrderDirection } from 'helpers/constants';
import React from 'react';
import { prettyVoteWeight } from 'shared/adapters/currency';
import app from 'state';
import { User } from 'views/components/user/user';
import { CWText } from '../../../component_kit/cw_text';
import { CWTable } from '../../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../../component_kit/new_designs/CWTable/useCWTableState';

type Upvoter = {
  name: string;
  avatarUrl: string;
  address: string;
  updated_at: string;
  voting_weight: number;
};

type UpvotesTabProps = {
  reactorData: Upvoter[];
  tokenDecimals?: number | null;
  topicWeight?: TopicWeightedVoting | null;
};

export const UpvotesTab = ({
  reactorData,
  tokenDecimals,
  topicWeight,
}: UpvotesTabProps) => {
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

  const tableState = useCWTableState({
    columns: columns.map((c) =>
      c.key === 'voteWeight'
        ? {
            ...c,
            tokenDecimals,
            weightedVoting: topicWeight,
          }
        : c,
    ),
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
    if (!voters) return [];
    return voters.map((voter) => voterRow(voter));
  };

  const getVoteWeightTotal = (voters: Upvoter[]) => {
    return voters.reduce(
      (memo, current) => memo + Number(current.voting_weight),
      0,
    );
  };

  return (
    <div className="upvotes-tab">
      {reactorData?.length > 0 ? (
        <>
          <CWTable
            columnInfo={tableState.columns}
            sortingState={tableState.sorting}
            setSortingState={tableState.setSorting}
            rowData={getRowData(reactorData).map((reactor) => ({
              ...reactor,
              name: {
                sortValue: reactor.name,
                customElement: (
                  <User
                    avatarSize={20}
                    userAddress={reactor.avatars.name.address}
                    userCommunityId={app?.chain?.id || ''}
                    shouldShowAsDeleted={
                      !reactor?.avatars?.name?.address && !app?.chain?.id
                    }
                    shouldLinkProfile
                  />
                ),
              },
            }))}
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
              <CWText type="b2">
                {prettyVoteWeight(
                  getVoteWeightTotal(reactorData).toString(),
                  tokenDecimals,
                  topicWeight,
                  1,
                  6,
                )}
              </CWText>
            </div>
          </div>
        </>
      ) : (
        <CWText className="empty-upvotes-container" type="b1">
          There are no upvotes to view.
        </CWText>
      )}
    </div>
  );
};
