import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';

import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWGrid from '../../components/component_kit/new_designs/CWGrid';
import { CWMobileTab } from '../../components/component_kit/new_designs/CWMobileTab';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import ContestCard from '../CommunityManagement/Contests/ContestsList/ContestCard';
import FundContestDrawer from '../CommunityManagement/Contests/FundContestDrawer';
import { MobileTabType } from './ContestPage';
import EntriesTab from './tabs/Entries';
import PriceChartTab from './tabs/PriceChart';
import TokenSwapTab from './tabs/TokenSwap';
import { getCurrentContestIndex, getSortedContests } from './utils';

import './NewContestPage.scss';

interface NewContestPageProps {
  contestAddress: string;
}

const NewContestPage = ({ contestAddress }: NewContestPageProps) => {
  const [selectedMobileTab, setSelectedMobileTab] = useState<MobileTabType>(
    MobileTabType.Entries,
  );
  const navigate = useCommonNavigate();

  const { getContestByAddress, contestsData } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const [fundDrawerContest, setFundDrawerContest] = useState<
    typeof contest | null
  >();

  const { end_time } = contest?.contests[0] || {};

  const sortedContests = getSortedContests(contestsData?.all);
  const currentContestIndex = getCurrentContestIndex(
    sortedContests,
    contestAddress,
  );

  const handleNavigateContest = (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'prev' ? currentContestIndex - 1 : currentContestIndex + 1;

    const targetContest = sortedContests[newIndex];

    if (targetContest) {
      navigate(`/contests/${targetContest.contest_address}`);
    }
  };

  return (
    <CWPageLayout>
      <div className="NewContestPage">
        <div className="top-container">
          {contest && (
            <ContestCard
              key={contest?.contest_address}
              isAdmin={false}
              address={contest?.contest_address}
              name={contest?.name}
              imageUrl={contest?.image_url || ''}
              topics={contest?.topics}
              decimals={contest?.decimals}
              ticker={contest?.ticker}
              finishDate={end_time ? moment(end_time).toISOString() : ''}
              isCancelled={!!contest?.cancelled}
              isRecurring={!contest?.funding_token_address}
              isHorizontal
              showShareButton={false}
              showLeaderboardButton={false}
              payoutStructure={contest?.payout_structure}
              isFarcaster={contest?.is_farcaster_contest}
              onFund={() => setFundDrawerContest(contest)}
            />
          )}

          <div className="navigation-buttons">
            <CWButton
              buttonType="secondary"
              iconLeft="arrowLeftPhosphor"
              label="Previous Contest"
              onClick={() => handleNavigateContest('prev')}
              containerClassName="previous-btn"
              disabled={currentContestIndex <= 0}
            />
            <CWButton label={contest?.name} containerClassName="contest-name" />
            <CWButton
              buttonType="secondary"
              label="Next Contest"
              iconRight="arrowRightPhosphor"
              onClick={() => handleNavigateContest('next')}
              containerClassName="next-btn"
              disabled={currentContestIndex >= sortedContests.length - 1}
            />
          </div>
        </div>

        <div className="mobile-tabs">
          <CWMobileTab
            label={MobileTabType.Entries}
            icon="trophy"
            isActive={selectedMobileTab === MobileTabType.Entries}
            onClick={() => setSelectedMobileTab(MobileTabType.Entries)}
          />
          <CWMobileTab
            label={MobileTabType.PriceChart}
            icon="chartLineUp"
            isActive={selectedMobileTab === MobileTabType.PriceChart}
            onClick={() => setSelectedMobileTab(MobileTabType.PriceChart)}
          />
          <CWMobileTab
            label={MobileTabType.TokenSwap}
            icon="arrowClockwise"
            isActive={selectedMobileTab === MobileTabType.TokenSwap}
            onClick={() => setSelectedMobileTab(MobileTabType.TokenSwap)}
          />
        </div>

        <div className="mobile-tab-content">
          {selectedMobileTab === MobileTabType.Entries && <EntriesTab />}
          {selectedMobileTab === MobileTabType.PriceChart && <PriceChartTab />}
          {selectedMobileTab === MobileTabType.TokenSwap && <TokenSwapTab />}
        </div>

        <div className="desktop-view">
          <CWGrid>
            <div>
              <EntriesTab />
            </div>
            <div>
              <TokenSwapTab />
              <PriceChartTab />
            </div>
          </CWGrid>
        </div>
      </div>

      <FundContestDrawer
        onClose={() => setFundDrawerContest(undefined)}
        isOpen={!!fundDrawerContest}
        contestAddress={fundDrawerContest?.contest_address || ''}
        fundingTokenAddress={fundDrawerContest?.funding_token_address || ''}
        fundingTokenTicker={fundDrawerContest?.ticker || 'ETH'}
      />
    </CWPageLayout>
  );
};

export default NewContestPage;
