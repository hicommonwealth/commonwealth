import React from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import ContestsList from '../ContestsList';
import EmptyContestsList from '../EmptyContestsList';
import FeeManagerBanner from './FeeManagerBanner';
import type { AdminContestsPageData } from './useAdminContestsPageData';

type AdminContestsPageListProps = Pick<
  AdminContestsPageData,
  | 'communityInfo'
  | 'contestListIsEmpty'
  | 'contestsData'
  | 'feeManagerBalance'
  | 'isContestAvailable'
  | 'isContestDataLoading'
  | 'isFeeManagerBalanceLoading'
  | 'setContestView'
  | 'showBanner'
>;

const AdminContestsPageList = ({
  communityInfo,
  contestListIsEmpty,
  contestsData,
  feeManagerBalance,
  isContestAvailable,
  isContestDataLoading,
  isFeeManagerBalanceLoading,
  setContestView,
  showBanner,
}: AdminContestsPageListProps) => {
  if (contestListIsEmpty) {
    return <EmptyContestsList onSetContestView={setContestView} />;
  }

  return (
    <>
      {showBanner && (
        <FeeManagerBanner
          feeManagerBalance={feeManagerBalance}
          isLoading={isFeeManagerBalanceLoading}
        />
      )}
      <CWText type="h3" className="mb-12">
        Active Contests
      </CWText>
      {!isContestAvailable && !contestsData.active.length ? (
        <CWText>No active contests available</CWText>
      ) : (
        <ContestsList
          contests={contestsData.active}
          isAdmin
          isLoading={isContestDataLoading}
          isContestAvailable={isContestAvailable}
          onSetContestView={setContestView}
          community={communityInfo}
        />
      )}

      <CWDivider className="ended" />
      <CWText type="h3" className="mb-12">
        Previous Contests
      </CWText>
      {isContestAvailable && contestsData.finished.length === 0 ? (
        <CWText>No previous contests available</CWText>
      ) : (
        <ContestsList
          contests={contestsData.finished}
          isAdmin
          isLoading={isContestDataLoading}
          isContestAvailable={isContestAvailable}
          displayAllRecurringContests
          onSetContestView={setContestView}
          community={communityInfo}
        />
      )}
    </>
  );
};

export default AdminContestsPageList;
