import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { APIOrderDirection } from 'helpers/constants';
import Account from 'models/Account';
import AddressInfo from 'models/AddressInfo';
import MinimumProfile from 'models/MinimumProfile';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { prettyVoteWeight } from 'shared/adapters/currency';
import app from 'state';
import { User } from 'views/components/user/user';
import { AuthorAndPublishInfo } from '../../../pages/discussions/ThreadCard/AuthorAndPublishInfo';
import { CWText } from '../../component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from '../../component_kit/new_designs/CWDrawer';
import { CWTable } from '../../component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from '../../component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from '../../component_kit/new_designs/CWTable/useCWTableState';
import { CWTab, CWTabsRow } from '../../component_kit/new_designs/CWTabs';
import './ViewUpvotesDrawer.scss';

type Profile = Account | AddressInfo | MinimumProfile;

type ViewUpvotesDrawerProps = {
  header: string;
  reactorData: any[];
  author: Profile;
  publishDate: moment.Moment;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  tokenDecimals?: number | null | undefined;
  topicWeight?: TopicWeightedVoting | null | undefined;
};

type Upvoter = {
  name: string;
  avatarUrl: string;
  address: string;
  updated_at: string;
  voting_weight: number;
};

type TabType = 'upvotes' | 'holders' | 'tradeActivity';

const UpvotesTab = ({
  reactorData,
  tokenDecimals,
  topicWeight,
}: {
  reactorData: Upvoter[];
  tokenDecimals?: number | null;
  topicWeight?: TopicWeightedVoting | null;
}) => {
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

const HoldersTab = () => {
  return (
    <div className="holders-tab">
      <CWText type="b1">Holders information will be displayed here</CWText>
    </div>
  );
};

const TradeActivityTab = () => {
  return (
    <div className="trade-activity-tab">
      <CWText type="b1">Trade activity will be displayed here</CWText>
    </div>
  );
};

export const ViewUpvotesDrawer = ({
  header,
  reactorData,
  author,
  publishDate,
  isOpen,
  setIsOpen,
  tokenDecimals,
  topicWeight,
}: ViewUpvotesDrawerProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('upvotes');

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
        id: author['profile']?.id || author['profile']?.userId,
        userId: author['profile']?.userId,
        address: author['profile'].address,
        name: author['profile'].name,
      }
    : undefined;

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
                key={JSON.stringify(profile)}
                authorAddress={author?.address}
                authorCommunityId={getAuthorCommunityId(author) || ''}
                publishDate={publishDate}
                showUserAddressWithInfo={false}
                profile={profile}
              />
            </div>
          </div>

          <CWTabsRow>
            <CWTab
              label="Upvotes"
              isSelected={activeTab === 'upvotes'}
              onClick={() => setActiveTab('upvotes')}
            />
            <CWTab
              label="Holders"
              isSelected={activeTab === 'holders'}
              onClick={() => setActiveTab('holders')}
            />
            <CWTab
              label="Trade Activity"
              isSelected={activeTab === 'tradeActivity'}
              onClick={() => setActiveTab('tradeActivity')}
            />
          </CWTabsRow>

          <div className="tab-content">
            {activeTab === 'upvotes' && (
              <UpvotesTab
                reactorData={reactorData}
                tokenDecimals={tokenDecimals}
                topicWeight={topicWeight}
              />
            )}
            {activeTab === 'holders' && <HoldersTab />}
            {activeTab === 'tradeActivity' && <TradeActivityTab />}
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};
