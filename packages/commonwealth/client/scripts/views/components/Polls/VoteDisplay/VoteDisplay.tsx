import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
// eslint-disable-next-line import/no-cycle
import { VoteInformation } from 'views/components/Polls';

import './VoteDisplay.scss';

export type VoteDisplayProps = {
  timeRemaining: string;
  voteDirectionString: string;
  pollEnded: boolean;
  voteInformation: Array<VoteInformation>;
  isSnapshot: boolean;
};

export const VoteDisplay = ({
  pollEnded,
  timeRemaining,
  voteDirectionString,
  voteInformation,
  isSnapshot,
}: VoteDisplayProps) => {
  const atLeastOneVote =
    voteInformation.filter((vote) => vote.voteCount > 0).length > 0;

  const topResponse = atLeastOneVote
    ? voteInformation.sort(
        (option1, option2) => option2.voteCount - option1.voteCount,
      )[0].label
    : null;

  return (
    <div className="VoteDisplay">
      {!pollEnded ? (
        <>
          <div className="vote-direction">
            <CWIcon
              iconName="check"
              iconSize="small"
              className="vote-check-icon"
            />
            <CWText type="caption">{voteDirectionString}</CWText>
          </div>
          <CWText className="time-remaining-text" type="caption">
            {timeRemaining}
          </CWText>
        </>
      ) : (
        <div className="completed-vote-information">
          <CWText type="caption">{`This ${
            isSnapshot ? 'Proposal' : 'Poll'
          } is Complete`}</CWText>

          {topResponse ? (
            <CWText type="caption">{`"${topResponse}" was the Top Response`}</CWText>
          ) : (
            <CWText type="caption">There was no responses</CWText>
          )}
          {voteDirectionString !== '' && (
            <CWText
              type="caption"
              fontWeight="medium"
              className="direction-text"
            >
              {voteDirectionString}
            </CWText>
          )}
        </div>
      )}
    </div>
  );
};
