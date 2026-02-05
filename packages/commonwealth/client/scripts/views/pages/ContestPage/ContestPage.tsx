import React from 'react';
import { PageNotFound } from 'views/pages/404';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';

import NewContestPage from './NewContestPage';

interface ContestPageProps {
  contestAddress: string;
}

const ContestPage = ({ contestAddress }: ContestPageProps) => {
  const { getContestByAddress, isContestDataLoading } = useCommunityContests();
  const contest = getContestByAddress(contestAddress);

  if (!isContestDataLoading && !contest) {
    return <PageNotFound />;
  }

  return <NewContestPage contestAddress={contestAddress} />;
};

export default ContestPage;
