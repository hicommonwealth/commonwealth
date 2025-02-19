import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import React, { useState } from 'react';
import 'react-farcaster-embed/dist/styles.css';
import useFetchFarcasterCastsQuery from 'state/api/contests/getFarcasterCasts';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import ContestCard from 'views/pages/CommunityManagement/Contests/ContestsList/ContestCard';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import FundContestDrawer from '../CommunityManagement/Contests/FundContestDrawer';
import FarcasterEntriesList from './FarcasterEntriesList';
import NewContestPage from './NewContestPage';
import { SortType, sortOptions } from './types';

import './ContestPage.scss';

export enum MobileTabType {
  Entries = 'Entries',
  PriceChart = 'Price Chart',
  TokenSwap = 'Token Swap',
}

interface ContestPageProps {
  contestAddress: string;
}

const ContestPage = ({ contestAddress }: ContestPageProps) => {
  const newContestPageEnabled = useFlag('newContestPage');
  const { getContestByAddress, isContestDataLoading } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const [fundDrawerContest, setFundDrawerContest] = useState<
    typeof contest | null
  >();
  const [selectedSort, setSelectedSort] = useState<SortType>(
    sortOptions[0].value,
  );

  const { data: farcasterCasts, isLoading: isFarcasterCastsLoading } =
    useFetchFarcasterCastsQuery({
      contest_address: contestAddress,
      selectedSort,
    });

  if (!isContestDataLoading && !contest) {
    return <PageNotFound />;
  }

  const { end_time } = contest?.contests[0] || {};

  if (!newContestPageEnabled) {
    return <NewContestPage contestAddress={contestAddress} />;
  }

  return (
    <CWPageLayout>
      <div className="ContestPage">
        <CWText type="h2">Leaderboard</CWText>
        <CWText className="description">
          Check out the contest details including leaderboard.
        </CWText>
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

        <div className="leaderboard-list">
          <FarcasterEntriesList
            isLoading={isFarcasterCastsLoading}
            entries={farcasterCasts || []}
            selectedSort={selectedSort}
            onSortChange={(sort) => setSelectedSort(sort)}
          />
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

export default ContestPage;
