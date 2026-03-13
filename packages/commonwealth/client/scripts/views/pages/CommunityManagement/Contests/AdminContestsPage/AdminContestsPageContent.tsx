import AddressInfo from 'client/scripts/models/AddressInfo';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CommunityOnchainTransactions from '../../../CreateCommunity/steps/CommunityOnchainTransactions';
import { TransactionType } from '../../../CreateCommunity/steps/CommunityOnchainTransactions/helpers';
import { ContestView } from '../types';
import AdminContestsPageList from './AdminContestsPageList';
import AdminContestsPageTypeSelection from './AdminContestsPageTypeSelection';
import type { AdminContestsPageData } from './useAdminContestsPageData';

const AdminContestsPageContent = ({
  community,
  contestListIsEmpty,
  contestView,
  contestsData,
  ethChainId,
  feeManagerBalance,
  goToContestTypeSelection,
  goToCreateTopicPage,
  goToLaunchCommonContest,
  goToLaunchFarcasterContest,
  handleCreateContestClicked,
  hasAtLeastOneWeightedVotingTopic,
  isContestAvailable,
  isContestDataLoading,
  isFeeManagerBalanceLoading,
  judgeContestEnabled,
  selectedAddress,
  setContestView,
  showBanner,
  communityInfo,
}: AdminContestsPageData) => {
  return (
    <div className="AdminContestsPage">
      <div className="admin-header-row">
        <CWText type="h2">Contests</CWText>

        {contestView === ContestView.List &&
          isContestAvailable &&
          !contestListIsEmpty && (
            <CWButton
              iconLeft="plusPhosphor"
              label="Create contest"
              onClick={handleCreateContestClicked}
            />
          )}
      </div>

      {contestView === ContestView.List ? (
        <AdminContestsPageList
          communityInfo={communityInfo}
          contestListIsEmpty={contestListIsEmpty}
          contestsData={contestsData}
          feeManagerBalance={feeManagerBalance}
          isContestAvailable={isContestAvailable}
          isContestDataLoading={isContestDataLoading}
          isFeeManagerBalanceLoading={isFeeManagerBalanceLoading}
          setContestView={setContestView}
          showBanner={showBanner}
        />
      ) : contestView === ContestView.TypeSelection ? (
        <AdminContestsPageTypeSelection
          community={community}
          goToCreateTopicPage={goToCreateTopicPage}
          goToLaunchCommonContest={goToLaunchCommonContest}
          goToLaunchFarcasterContest={goToLaunchFarcasterContest}
          hasAtLeastOneWeightedVotingTopic={hasAtLeastOneWeightedVotingTopic}
          judgeContestEnabled={judgeContestEnabled}
          setContestView={setContestView}
        />
      ) : contestView === ContestView.NamespaceEnablemenement ? (
        <CommunityOnchainTransactions
          createdCommunityName={community?.name}
          createdCommunityId={community?.id || ''}
          selectedAddress={selectedAddress as AddressInfo}
          chainId={String(ethChainId)}
          transactionTypes={[TransactionType.DeployNamespace]}
          onConfirmNamespaceDataStepCancel={goToContestTypeSelection}
          onSignTransaction={(type) => {
            if (type === TransactionType.DeployNamespace) {
              goToLaunchFarcasterContest();
            }
          }}
          onSignTransactionsStepCancel={goToContestTypeSelection}
        />
      ) : null}
    </div>
  );
};

export default AdminContestsPageContent;
