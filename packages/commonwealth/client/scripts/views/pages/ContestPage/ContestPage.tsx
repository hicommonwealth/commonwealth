import moment from 'moment';
import React, { useState } from 'react';
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client';
import 'react-farcaster-embed/dist/styles.css';

import { Select } from 'views/components/Select';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import ContestCard from 'views/pages/CommunityManagement/Contests/ContestsList/ContestCard';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import './ContestPage.scss';

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

interface ContestPageProps {
  contestAddress: string;
}

const ContestPage = ({ contestAddress }: ContestPageProps) => {
  const { getContestByAddress, isContestDataLoading } = useCommunityContests();

  const contest = getContestByAddress(contestAddress);
  console.log('contest', contest);

  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);

  if (!isContestDataLoading && !contest) {
    return <PageNotFound />;
  }

  const { end_time, score } = contest?.contests[0] || {};

  const entries = [
    'https://warpcast.com/kugusha.eth/0x64be20bf',
    'https://warpcast.com/antimofm.eth/0xd082a36c',
    'https://warpcast.com/linda/0xa72c0daa',
    'https://warpcast.com/jacob/0x8653763f',
  ];

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
        {entries.length === 0 ? (
          <CWText className="description">
            No entries for the contest yet
          </CWText>
        ) : (
          <div className="leaderboard-list">
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
            {entries.map((entry) => (
              <FarcasterEmbed url={entry} key={entry} />
            ))}
          </div>
        )}
      </div>
    </CWPageLayout>
  );
};

export default ContestPage;
