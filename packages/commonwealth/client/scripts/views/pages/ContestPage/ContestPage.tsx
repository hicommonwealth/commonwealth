import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client';
import 'react-farcaster-embed/dist/styles.css';
import { useInView } from 'react-intersection-observer';

import { Select } from 'views/components/Select';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import ContestCard from 'views/pages/CommunityManagement/Contests/ContestsList/ContestCard';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import { useFetchFarcasterCastsQuery } from 'state/api/contests';
import { Skeleton } from 'views/components/Skeleton';
import CWCircleRingSpinner from 'views/components/component_kit/new_designs/CWCircleRingSpinner';
import './ContestPage.scss';

export enum SortType {
  DESC = 'desc',
  ASC = 'asc',
}

const sortOptions = [
  {
    value: SortType.DESC,
    label: 'Descending',
  },
  {
    value: SortType.ASC,
    label: 'Ascending',
  },
];

interface ContestPageProps {
  contestAddress: string;
}

const ContestPage = ({ contestAddress }: ContestPageProps) => {
  const { getContestByAddress, isContestDataLoading } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  const [ref, inView] = useInView();

  const [selectedSort, setSelectedSort] = useState(sortOptions[0].value);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useFetchFarcasterCastsQuery({
      contestAddress,
      selectedSort,
    });

  useEffect(() => {
    if (inView && !isFetchingNextPage && hasNextPage) {
      fetchNextPage().catch(console.log);
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

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
          />
        )}

        <div className="leaderboard-list">
          {isLoading ? (
            <>
              <Skeleton height={300} width="100%" />
              <Skeleton height={300} width="100%" />
            </>
          ) : data?.pages?.[0].data?.length === 0 ? (
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

              {data?.pages.map((page) => (
                <React.Fragment key={page.currentPage}>
                  {page.data.map((entry) => (
                    <div key={entry.id}>
                      <CWText>Likes: {entry.like}</CWText>
                      <FarcasterEmbed url={entry.url} />
                    </div>
                  ))}
                </React.Fragment>
              ))}

              {isFetchingNextPage && <CWCircleRingSpinner />}

              <div ref={ref} />
            </>
          )}
        </div>
      </div>
    </CWPageLayout>
  );
};

export default ContestPage;
