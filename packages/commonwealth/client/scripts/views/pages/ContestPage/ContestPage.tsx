import moment from 'moment';
import React, { useState } from 'react';
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client';
import 'react-farcaster-embed/dist/styles.css';
import useFetchFarcasterCastsQuery from 'state/api/contests/getFarcasterCasts';
import { Select } from 'views/components/Select';
import { Skeleton } from 'views/components/Skeleton';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import CWUpvoteSmall from 'views/components/component_kit/new_designs/CWUpvoteSmall';
import { CWUpvote } from 'views/components/component_kit/new_designs/cw_upvote';
import { PageNotFound } from 'views/pages/404';
import ContestCard from 'views/pages/CommunityManagement/Contests/ContestsList/ContestCard';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import './ContestPage.scss';

export enum SortType {
  Upvotes = 'upvotes',
  Recent = 'recent',
}

const sortOptions = [
  {
    value: SortType.Upvotes,
    label: 'Most Upvoted',
  },
  {
    value: SortType.Recent,
    label: 'Most Recent',
  },
];

interface ContestPageProps {
  contestAddress: string;
}

const ContestPage = ({ contestAddress }: ContestPageProps) => {
  const { getContestByAddress, isContestDataLoading } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

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
          />
        )}

        <div className="leaderboard-list">
          {isFarcasterCastsLoading ? (
            <>
              <Skeleton height={300} width="100%" />
              <Skeleton height={300} width="100%" />
            </>
          ) : !farcasterCasts?.[0]?.replies?.length ? (
            <CWText>No entries for the contest yet</CWText>
          ) : (
            <>
              <div className="filter-section">
                <CWText type="b2" fontWeight="medium">
                  Sort
                </CWText>
                <Select
                  selected={selectedSort}
                  onSelect={(v: { value: string; label: string }) =>
                    setSelectedSort(v.value as SortType)
                  }
                  options={sortOptions}
                />
              </div>

              {farcasterCasts[0].replies?.map((entry) => {
                return (
                  <div key={entry.hash} className="cast-container">
                    <CWUpvote disabled voteCount={entry.weightedVotes || '0'} />

                    <div className="upvote-small">
                      <CWUpvoteSmall
                        voteCount={entry.weightedVotes || '0'}
                        disabled
                        selected={false}
                        onClick={() => undefined}
                        popoverContent={<></>}
                        tooltipText="Farcaster Upvotes"
                      />
                    </div>

                    <FarcasterEmbed
                      key={entry.hash}
                      hash={entry.hash}
                      username={entry.author.username}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </CWPageLayout>
  );
};

export default ContestPage;
