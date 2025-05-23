import React from 'react';

import { ContestView } from 'models/Thread';

import ThreadContestTag from './ThreadContestTag';
import { getWinnersFromAssociatedContests } from './utils';

interface ThreadContestTagContainerProps {
  associatedContests?: ContestView[];
}

const ThreadContestTagContainer = ({
  associatedContests,
}: ThreadContestTagContainerProps) => {
  const contestWinners = getWinnersFromAssociatedContests(associatedContests);

  const showContestWinnerTag = contestWinners.length > 0;

  return (
    <>
      {showContestWinnerTag &&
        contestWinners.map((winner, index) => {
          if (!winner || winner?.prize === null || winner?.prize === -1) {
            return null;
          }

          return (
            <ThreadContestTag
              date={winner.date}
              round={winner.round}
              title={winner.title ?? ''}
              prize={winner.prize + 1}
              key={index}
            />
          );
        })}
    </>
  );
};

export default ThreadContestTagContainer;
