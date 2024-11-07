import moment from 'moment';
import React, { useState } from 'react';

import { useFlag } from 'hooks/useFlag';
import { Skeleton } from 'views/components/Skeleton';

import EmptyContestsList from '../EmptyContestsList';
import FundContestDrawer from '../FundContestDrawer';
import { ContestView } from '../types';
import ContestCard from './ContestCard';

import './ContestsList.scss';

export type Contest = {
  is_farcaster_contest?: boolean;
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
  isContestAvailable: boolean;
  onSetContestView?: (type: ContestView) => void;
  hasNamespace?: boolean;
  displayAllRecurringContests?: boolean;
}

const ContestsList = ({
  contests,
  isAdmin,
  isLoading,
  hasWeightedTopic,
  isContestAvailable,
  hasNamespace = false,
  onSetContestView,
  displayAllRecurringContests = false,
}: ContestsListProps) => {
  const [fundDrawerContest, setFundDrawerContest] = useState<Contest>();
  const farcasterContestEnabled = useFlag('farcasterContest');

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
        ((farcasterContestEnabled ? !isContestAvailable : !hasWeightedTopic) ||
          !isContestAvailable) ? (
          <EmptyContestsList
            hasWeightedTopic={hasWeightedTopic}
            isContestAvailable={isContestAvailable}
            onSetContestView={onSetContestView}
            hasNamespace={hasNamespace}
          />
        ) : (
          contests.map((contest) => {
            const sortedContests = (contest?.contests || []).toSorted((a, b) =>
              moment(a.end_time).isBefore(b.end_time) ? -1 : 1,
            );

            if (!displayAllRecurringContests) {
              // only last contest is relevant
              const { end_time } =
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
                  decimals={contest.decimals}
                  ticker={contest.ticker}
                  finishDate={end_time ? moment(end_time).toISOString() : ''}
                  isCancelled={contest.cancelled}
                  onFund={() => setFundDrawerContest(contest)}
                  isRecurring={!contest.funding_token_address}
                  payoutStructure={contest.payout_structure}
                  isFarcaster={
                    farcasterContestEnabled && contest.is_farcaster_contest
                  }
                />
              );
            } else {
              return sortedContests.map((sc) => (
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
                  decimals={contest.decimals}
                  ticker={contest.ticker}
                  finishDate={
                    sc.end_time ? moment(sc.end_time || {}).toISOString() : ''
                  }
                  isCancelled={contest.cancelled}
                  onFund={() => setFundDrawerContest(contest)}
                  isRecurring={!contest.funding_token_address}
                  payoutStructure={contest.payout_structure}
                  isFarcaster={
                    farcasterContestEnabled && contest.is_farcaster_contest
                  }
                />
              ));
            }
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
