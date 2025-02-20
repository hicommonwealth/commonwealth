import moment from 'moment';
import React, { useState } from 'react';

import useFetchFarcasterCastsQuery from 'client/scripts/state/api/contests/getFarcasterCasts';
import useFetchThreadsQuery from 'client/scripts/state/api/threads/fetchThreads';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWGrid from '../../components/component_kit/new_designs/CWGrid';
import { CWMobileTab } from '../../components/component_kit/new_designs/CWMobileTab';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import ContestCard from '../CommunityManagement/Contests/ContestsList/ContestCard';
import FundContestDrawer from '../CommunityManagement/Contests/FundContestDrawer';
import { RenderThreadCard } from '../discussions/RenderThreadCard';
import { MobileTabType } from './ContestPage';
import useTokenData from './hooks/useTokenData';
import EntriesTab from './tabs/Entries';
import PriceChartTab from './tabs/PriceChart';
import TokenSwapTab from './tabs/TokenSwap';
import { SortType } from './types';

import './NewContestPage.scss';

interface NewContestPageProps {
  contestAddress: string;
}
const NewContestPage = ({ contestAddress }: NewContestPageProps) => {
  const [selectedMobileTab, setSelectedMobileTab] = useState<MobileTabType>(
    MobileTabType.Entries,
  );

  const { getContestByAddress, contestsData } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const [fundDrawerContest, setFundDrawerContest] = useState<
    typeof contest | null
  >();

  const { data: farcasterCasts, isLoading: isFarcasterCastsLoading } =
    useFetchFarcasterCastsQuery({
      contest_address: contestAddress,
      selectedSort: SortType.Upvotes,
      isEnabled: !!contest?.is_farcaster_contest,
    });

  const { data: threads } = useFetchThreadsQuery({
    communityId: contest?.community_id || '',
    queryType: 'bulk',
    page: 1,
    limit: 30,
    topicId: contest?.topic_id || undefined,
    apiEnabled: !!contest && !contest?.is_farcaster_contest,
  });

  const { chain, address } = useTokenData();

  const { end_time } = contest?.contests[0] || {};

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
              onClick={() => {
                console.log('previous contest');
              }}
              containerClassName="previous-btn"
            />
            <CWButton label={contest?.name} containerClassName="contest-name" />
            <CWButton
              buttonType="secondary"
              label="Next Contest"
              iconRight="arrowRightPhosphor"
              onClick={() => {
                console.log('next contest');
              }}
              containerClassName="next-btn"
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
          {chain && address && (
            <CWMobileTab
              label={MobileTabType.PriceChart}
              icon="chartLineUp"
              isActive={selectedMobileTab === MobileTabType.PriceChart}
              onClick={() => setSelectedMobileTab(MobileTabType.PriceChart)}
            />
          )}
          {address && (
            <CWMobileTab
              label={MobileTabType.TokenSwap}
              icon="arrowClockwise"
              isActive={selectedMobileTab === MobileTabType.TokenSwap}
              onClick={() => setSelectedMobileTab(MobileTabType.TokenSwap)}
            />
          )}
        </div>

        <div className="mobile-tab-content">
          {selectedMobileTab === MobileTabType.Entries && (
            <>
              {contest?.is_farcaster_contest ? (
                <EntriesTab
                  isLoading={isFarcasterCastsLoading}
                  entries={farcasterCasts || []}
                  selectedSort={SortType.Upvotes}
                  onSortChange={() => {}}
                />
              ) : (
                threads?.map((thread) => (
                  <RenderThreadCard
                    key={thread.id}
                    thread={thread}
                    communityId={contest?.community_id || ''}
                    contestsData={contestsData}
                  />
                ))
              )}
            </>
          )}
          {selectedMobileTab === MobileTabType.PriceChart && <PriceChartTab />}
          {selectedMobileTab === MobileTabType.TokenSwap && <TokenSwapTab />}
        </div>

        <div className="desktop-view">
          <CWGrid>
            <div className="thread-list-container">
              {contest?.is_farcaster_contest ? (
                <EntriesTab
                  isLoading={false}
                  entries={farcasterCasts || []}
                  selectedSort={SortType.Upvotes}
                  onSortChange={() => {}}
                />
              ) : (
                threads?.map((thread) => (
                  <RenderThreadCard
                    key={thread.id}
                    thread={thread}
                    communityId={contest?.community_id || ''}
                    contestsData={contestsData}
                  />
                ))
              )}
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
