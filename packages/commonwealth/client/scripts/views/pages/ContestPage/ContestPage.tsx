import moment from 'moment';
import React, { useState } from 'react';

import { Select } from 'views/components/Select';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import ContestCard from 'views/pages/CommunityManagement/Contests/ContestsList/ContestCard';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import './ContestPage.scss';

interface ContestPageProps {
  contestAddress: string;
}

const sortOptions = [
  {
    value: 'desc',
    label: 'Descending',
  },
  {
    value: 'asc',
    label: 'Ascending',
  },
];

const ContestPage = ({ contestAddress }: ContestPageProps) => {
  const { getContestByAddress, isContestDataLoading } = useCommunityContests();

  const contest = getContestByAddress(contestAddress);
  console.log('contest', contest);

  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);

  if (!isContestDataLoading && !contest) {
    return <PageNotFound />;
  }

  const { end_time, score } = contest?.contests[0] || {};

  return (
    <CWPageLayout>
      <div className="ContestPage">
        <CWText type="h2">Leaderboard</CWText>
        <CWText className="description">
          Check out the contest details including leaderboard.
        </CWText>

        <ContestCard
          key={contest.contest_address}
          isAdmin={false}
          address={contest.contest_address}
          name={contest.name}
          imageUrl={contest.image_url}
          topics={contest.topics}
          score={score}
          decimals={contest.decimals}
          ticker={contest.ticker}
          finishDate={end_time ? moment(end_time).toISOString() : ''}
          isCancelled={contest.cancelled}
          isRecurring={!contest.funding_token_address}
          isHorizontal
          showShareButton={false}
          showLeaderboardButton={false}
        />

        <div className="filter-section">
          <CWText type="b2" fontWeight="medium">
            Sort
          </CWText>
          <Select
            selected={selectedSort.value}
            onSelect={setSelectedSort}
            options={sortOptions}
          />
        </div>
      </div>
    </CWPageLayout>
  );
};

export default ContestPage;
