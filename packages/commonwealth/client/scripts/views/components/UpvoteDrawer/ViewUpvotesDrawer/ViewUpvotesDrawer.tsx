import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import Account from 'models/Account';
import AddressInfo from 'models/AddressInfo';
import MinimumProfile from 'models/MinimumProfile';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { AuthorAndPublishInfo } from '../../../pages/discussions/ThreadCard/AuthorAndPublishInfo';
import { CWText } from '../../component_kit/cw_text';
import CWDrawer, {
  CWDrawerTopBar,
} from '../../component_kit/new_designs/CWDrawer';
import { CWTab, CWTabsRow } from '../../component_kit/new_designs/CWTabs';
import { HoldersTab } from './Tabs/HoldersTab';
import { TradeActivityTab } from './Tabs/TradeActivityTab';
import { UpvotesTab } from './Tabs/UpvotesTab';
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
  launchpadTokenAddress?: string;
};

type TabType = 'upvotes' | 'holders' | 'tradeActivity';

export const ViewUpvotesDrawer = ({
  header,
  reactorData,
  author,
  publishDate,
  isOpen,
  setIsOpen,
  tokenDecimals,
  topicWeight,
  launchpadTokenAddress,
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
            {activeTab === 'tradeActivity' && launchpadTokenAddress && (
              <TradeActivityTab tokenAddress={launchpadTokenAddress} />
            )}
          </div>
        </div>
      </CWDrawer>
    </div>
  );
};
