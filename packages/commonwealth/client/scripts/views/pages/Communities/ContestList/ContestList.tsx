import React from 'react';
import useCommunityContests from '../../CommunityManagement/Contests/useCommunityContests';

import './ContestList.scss';

const ContestList = () => {
  const {
    contestsData: { active: activeContests },
    isContestDataLoading,
  } = useCommunityContests({
    fetchAll: true,
  });

  console.log('activeContests', activeContests);

  return (
    <div className="ContestList ">
      {isContestDataLoading ? <div>Loading...</div> : null}
    </div>
  );
};

export default ContestList;
