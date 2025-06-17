import moment from 'moment';
import React, { useState } from 'react';
import app from 'state';

import { Skeleton } from 'views/components/Skeleton';

import ContestCard from 'views/components/ContestCard';
import FundContestDrawer from '../FundContestDrawer';
import { ContestView } from '../types';

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
  namespace_judges?: string[];
  namespace_judge_token_id?: number;
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
    contest_balance?: string;
  }[];
};

interface ContestsListProps {
  contests: Contest[];
  isAdmin: boolean;
  isLoading: boolean;
  isContestAvailable?: boolean;
  onSetContestView?: (type: ContestView) => void;
  displayAllRecurringContests?: boolean;
  community?: {
    id: string;
    name: string;
    iconUrl: string;
    ethChainId: number;
    chainNodeUrl: string;
  };
}

const ContestsList = ({
  contests,
  isAdmin,
  isLoading,
  displayAllRecurringContests = false,
  community,
}: ContestsListProps) => {
  const [fundDrawerContest, setFundDrawerContest] = useState<Contest | null>();

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
        {contests.map((contest) => {
          const sortedContests = (contest?.contests || []).toSorted((a, b) =>
            moment(a.end_time).isBefore(b.end_time) ? -1 : 1,
          );

          if (!displayAllRecurringContests) {
            // only last contest is relevant
            const { end_time, score, contest_balance } =
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
                isRecurring={
                  contest.community_id &&
                  app?.chain?.id === contest.community_id
                    ? app?.chain?.base === 'solana'
                      ? false // Solana contests are never recurring
                      : (contest.interval || 0) > 0
                    : (contest.interval || 0) > 0
                }
                payoutStructure={contest.payout_structure}
                prizePercentage={contest.prize_percentage}
                isFarcaster={contest.is_farcaster_contest}
                score={score || []}
                community={community}
                contestBalance={parseInt(contest_balance || '0', 10)}
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
                isRecurring={
                  contest.community_id &&
                  app?.chain?.id === contest.community_id
                    ? app?.chain?.base === 'solana'
                      ? false // Solana contests are never recurring
                      : (contest.interval || 0) > 0
                    : (contest.interval || 0) > 0
                }
                payoutStructure={contest.payout_structure}
                prizePercentage={contest.prize_percentage}
                isFarcaster={contest.is_farcaster_contest}
                score={sc?.score || []}
                community={community}
                contestBalance={parseInt(sc.contest_balance || '0', 10)}
              />
            ));
          }
        })}
      </div>
      <FundContestDrawer
        onClose={() => setFundDrawerContest(undefined)}
        isOpen={!!fundDrawerContest}
        contestAddress={fundDrawerContest?.contest_address || ''}
        fundingTokenAddress={fundDrawerContest?.funding_token_address}
        fundingTokenTicker={fundDrawerContest?.ticker || 'ETH'}
        isRecurring={
          app?.chain?.base === 'solana'
            ? false // Solana contests are never recurring
            : (fundDrawerContest?.interval || 0) > 0
        }
      />
    </>
  );
};

export default ContestsList;
