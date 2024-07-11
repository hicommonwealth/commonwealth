import React from 'react';

import { useFlag } from 'hooks/useFlag';
import { AssociatedContest } from 'models/Thread';

import ThreadContestTag from './ThreadContestTag';
import { getWinnersFromAssociatedContests } from './utils';

interface ThreadContestTagContainerProps {
  associatedContests?: AssociatedContest[];
}

const ThreadContestTagContainer = ({
  associatedContests,
}: ThreadContestTagContainerProps) => {
  const contestsEnabled = useFlag('contest');

  const contestWinners = getWinnersFromAssociatedContests(associatedContests);

  const showContestWinnerTag = contestsEnabled && contestWinners.length > 0;

  return (
    <>
      {showContestWinnerTag &&
        contestWinners.map((winner, index) => {
          if (!winner || winner?.prize === 0) {
            return null;
          }

          return (
            <ThreadContestTag
              date={winner.date}
              round={winner.round}
              title={winner.title}
              prize={winner.prize}
              key={index}
            />
          );
        })}
    </>
  );
};

export default ThreadContestTagContainer;
