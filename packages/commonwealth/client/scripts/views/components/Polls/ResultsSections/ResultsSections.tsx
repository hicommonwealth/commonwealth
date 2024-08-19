import React from 'react';
import { CWProgressBar } from 'views/components/component_kit/cw_progress_bar';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import { VoteInformation } from 'views/components/Polls';

import './ResultsSections.scss';

const LIVE_PREVIEW_MAX = 3;
const ENDED_PREVIEW_MAX = 1;

export type ResultsSectionProps = {
  resultString?: string;
  onResultsClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  tokenSymbol?: string;
  totalVoteCount: number;
  voteInformation: Array<VoteInformation>;
  pollEnded: boolean;
  votedFor: string;
  isPreview: boolean;
};

export const ResultsSections = ({
  isPreview,
  onResultsClick,
  pollEnded,
  resultString,
  tokenSymbol,
  totalVoteCount,
  votedFor,
  voteInformation,
}: ResultsSectionProps) => {
  const calculateProgressStatus = (option: VoteInformation, index: number) => {
    if (!pollEnded) {
      return 'ongoing';
    } else if (index === 0) {
      return 'passed';
    } else if (option.label === votedFor) {
      return 'selected';
    } else {
      return 'neutral';
    }
  };

  const hasVotes =
    voteInformation.filter((vote) => vote.voteCount > 0).length > 0;
  let numOptionsBeyondPreview;
  if (!pollEnded) {
    numOptionsBeyondPreview = voteInformation.length - LIVE_PREVIEW_MAX;
  } else {
    numOptionsBeyondPreview = voteInformation.length - ENDED_PREVIEW_MAX;
  }

  return (
    <div className="ResultsSections">
      {!isPreview && (
        <div className="results-header">
          <CWText type="b1" fontWeight="bold">
            {resultString}
          </CWText>
          <CWText
            type="caption"
            className={getClasses<{ clickable?: boolean }>({
              // @ts-expect-error <StrictNullChecks/>
              clickable: onResultsClick && hasVotes,
            })}
            onClick={
              // @ts-expect-error <StrictNullChecks/>
              onResultsClick && hasVotes ? (e) => onResultsClick(e) : undefined
            }
          >
            {`${Math.floor(totalVoteCount * 100) / 100} ${
              tokenSymbol ?? 'votes'
            }`}
          </CWText>
        </div>
      )}
      <div className="results-content">
        {voteInformation
          .sort((option1, option2) => {
            if (pollEnded) {
              return option2.voteCount - option1.voteCount;
            } else {
              return 0;
            }
          })
          .map((option, index) => {
            if (
              isPreview &&
              (pollEnded
                ? index >= ENDED_PREVIEW_MAX
                : index >= LIVE_PREVIEW_MAX)
            ) {
              return;
            }
            return (
              <CWProgressBar
                progress={
                  option.voteCount
                    ? (option.voteCount / totalVoteCount) * 100
                    : 0
                }
                key={option.value}
                progressStatus={calculateProgressStatus(option, index)}
                label={option.label}
                iconName={option.label === votedFor ? 'check' : undefined}
              />
            );
          })}
      </div>
      {isPreview && numOptionsBeyondPreview > 0 && (
        <CWText type="caption" className="more-options">
          {`+ ${numOptionsBeyondPreview} more option${
            numOptionsBeyondPreview === 1 ? '' : 's'
          }`}
        </CWText>
      )}
    </div>
  );
};
