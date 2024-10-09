import moment from 'moment';
import React, { useState } from 'react';

import { useFlag } from 'hooks/useFlag';
import { Skeleton } from 'views/components/Skeleton';

import EmptyContestsList from '../EmptyContestsList';
import FundContestDrawer from '../FundContestDrawer';
import ContestCard from './ContestCard';

import './ContestsList.scss';

export type Contest = {
  community_id?: string;
  contest_address?: string;
  created_at?: Date;
  name?: string;
  image_url?: string;
  topics?: { id?: number; name?: string }[];
  cancelled?: boolean;
  decimals?: number;
  funding_token_address?: string;
  interval?: number;
  payout_structure?: number[];
  prize_percentage?: number;
  ticker?: string;
  contests?: {
    contest_id?: number;
    score?: {
      creator_address?: string;
      content_id?: string;
      votes?: number;
      prize?: string;
      tickerPrize?: number;
    }[];
    score_updated_at?: Date;
    start_time?: Date;
    end_time?: Date;
  }[];
};

interface ContestsListProps {
  contests: Contest[];
  isAdmin: boolean;
  isLoading: boolean;
  hasWeightedTopic: boolean;
  stakeEnabled: boolean;
  isContestAvailable: boolean;
  feeManagerBalance?: string;
  onSetContestSelectionView?: () => void;
}

const ContestsList = ({
  contests,
  isAdmin,
  isLoading,
  hasWeightedTopic,
  stakeEnabled,
  isContestAvailable,
  feeManagerBalance,
  onSetContestSelectionView,
}: ContestsListProps) => {
  const [fundDrawerContest, setFundDrawerContest] = useState<Contest>();
  const weightedTopicsEnabled = useFlag('weightedTopics');

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="ContestsListSkeleton" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="ContestsList">
        {isAdmin &&
        ((weightedTopicsEnabled ? !hasWeightedTopic : !stakeEnabled) ||
          !isContestAvailable) ? (
          <EmptyContestsList
            hasWeightedTopic={hasWeightedTopic}
            isStakeEnabled={stakeEnabled}
            isContestAvailable={isContestAvailable}
            onSetContestSelectionView={onSetContestSelectionView}
          />
        ) : (
          contests.map((contest) => {
            // only last contest is relevant
            const sortedContests = (contest?.contests || []).toSorted((a, b) =>
              moment(a.end_time).isBefore(b.end_time) ? -1 : 1,
            );

            const { end_time, score } =
              sortedContests[sortedContests.length - 1] || {};

            return (
              <ContestCard
                key={contest.contest_address}
                isAdmin={isAdmin}
                // @ts-expect-error <StrictNullChecks/>
                address={contest.contest_address}
                // @ts-expect-error <StrictNullChecks/>
                name={contest.name}
                imageUrl={contest.image_url}
                // @ts-expect-error <StrictNullChecks/>
                topics={contest.topics}
                score={score}
                decimals={contest.decimals}
                ticker={contest.ticker}
                finishDate={end_time ? moment(end_time).toISOString() : ''}
                isCancelled={contest.cancelled}
                onFund={() => setFundDrawerContest(contest)}
                feeManagerBalance={feeManagerBalance}
                isRecurring={!contest.funding_token_address}
              />
            );
          })
        )}
      </div>
      <FundContestDrawer
        onClose={() => setFundDrawerContest(undefined)}
        isOpen={!!fundDrawerContest}
        contestAddress={fundDrawerContest?.contest_address || ''}
        fundingTokenAddress={fundDrawerContest?.funding_token_address}
        fundingTokenTicker={fundDrawerContest?.ticker || 'ETH'}
      />
    </>
  );
};

export default ContestsList;
