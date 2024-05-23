import moment from 'moment';
import React, { useState } from 'react';

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
  stakeEnabled: boolean;
  isContestAvailable: boolean;
}
const ContestsList = ({
  contests,
  isAdmin,
  isLoading,
  stakeEnabled,
  isContestAvailable,
}: ContestsListProps) => {
  const [fundDrawerAddress, setFundDrawerAddress] = useState('');

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
        {isAdmin && (!stakeEnabled || !isContestAvailable) ? (
          <EmptyContestsList
            isStakeEnabled={stakeEnabled}
            isContestAvailable={isContestAvailable}
          />
        ) : (
          contests.map((contest) => {
            // only last contest is relevant
            const sortedContests = (contest?.contests || []).toSorted((a, b) =>
              moment(a.end_time).isBefore(b.end_time) ? -1 : 1,
            );

            const { end_time, score } =
              sortedContests[sortedContests.length - 1] || {};

            const hasEnded = moment(end_time) < moment();

            return (
              <ContestCard
                key={contest.contest_address}
                isAdmin={isAdmin}
                address={contest.contest_address}
                name={contest.name}
                imageUrl={contest.image_url}
                topics={contest.topics}
                score={score}
                finishDate={moment(end_time).toISOString()}
                isActive={!contest.cancelled && !hasEnded}
                onFund={() => setFundDrawerAddress(contest.contest_address)}
              />
            );
          })
        )}
      </div>
      <FundContestDrawer
        onClose={() => setFundDrawerAddress('')}
        isOpen={!!fundDrawerAddress}
        contestAddress={fundDrawerAddress}
      />
    </>
  );
};

export default ContestsList;
