import React, { useState } from 'react';

import 'components/poll_card.scss';

import { CWButton } from './component_kit/cw_button';
import { CWCard } from './component_kit/cw_card';
import { CWCheckbox } from './component_kit/cw_checkbox';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CWTooltip } from './component_kit/cw_popover/cw_tooltip';
import { CWProgressBar } from './component_kit/cw_progress_bar';
import { CWRadioButton } from './component_kit/cw_radio_button';
import { CWText } from './component_kit/cw_text';
import { getClasses } from './component_kit/helpers';

const LIVE_PREVIEW_MAX = 3;
const ENDED_PREVIEW_MAX = 1;

export type VoteInformation = {
  label: string;
  value: string;
  voteCount: number;
};

export function buildVoteDirectionString(voteOption: string) {
  return `You voted "${voteOption}"`;
}

export type PollOptionProps = {
  multiSelect: boolean;
  voteInformation: Array<VoteInformation>;
  selectedOptions?: Array<string>;
  disableVoteOptions?: boolean;
};

export const PollOptions = ({
  disableVoteOptions,
  multiSelect,
  selectedOptions,
  voteInformation,
}: PollOptionProps) => {
  return (
    <div className="PollOptions">
      {multiSelect
        ? voteInformation.map((option) => (
            <CWCheckbox
              checked={false}
              value=""
              label={option.label}
              onChange={() => {
                // TODO: Build this out when multiple vote options are introduced.
                // Something like: selectedOptions.push(option.value);
                console.log('A vote for multiple options');
              }}
            />
          ))
        : voteInformation.map((option) => (
            <CWRadioButton
              checked={
                selectedOptions.length > 0 &&
                option.value === selectedOptions[0]
              }
              groupName="votes"
              onChange={() => {
                selectedOptions[0] = option.value;
              }}
              label={option.label}
              value={option.value}
              disabled={disableVoteOptions}
            />
          ))}
    </div>
  );
};

export type CastVoteProps = {
  disableVoteButton: boolean;
  timeRemaining: string;
  tooltipErrorMessage: string;
  onVoteCast: (
    selectedOption?: string,
    handleVoteCast?: () => void,
    isSelected?: boolean
  ) => void;
};

export const CastVoteSection = ({
  disableVoteButton,
  onVoteCast,
  timeRemaining,
  tooltipErrorMessage,
}: CastVoteProps) => {
  return (
    <div className="CastVoteSection">
      {disableVoteButton ? (
        <CWTooltip
          content={tooltipErrorMessage ?? 'Select an option to vote.'}
          renderTrigger={(handleInteraction) => (
            <CWButton
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
              label="Vote"
              buttonType="mini-black"
              disabled={disableVoteButton}
              onClick={() => onVoteCast()}
            />
          )}
        />
      ) : (
        <CWButton
          label="Vote"
          buttonType="mini-black"
          disabled={disableVoteButton}
          onClick={() => onVoteCast()}
        />
      )}
      <CWText className="time-remaining-text" type="caption">
        {timeRemaining}
      </CWText>
    </div>
  );
};

export type VoteDisplayProps = {
  timeRemaining: string;
  voteDirectionString: string;
  pollEnded: boolean;
  voteInformation: Array<VoteInformation>;
};

export const VoteDisplay = ({
  pollEnded,
  timeRemaining,
  voteDirectionString,
  voteInformation,
}: VoteDisplayProps) => {
  const topResponse = voteInformation.sort(
    (option1, option2) => option2.voteCount - option1.voteCount
  )[0].label;

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
          <CWText type="caption">This Poll is Complete</CWText>
          <CWText type="caption">{`"${topResponse}" was the Top Response`}</CWText>
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

export type ResultsSectionProps = {
  resultString?: string;
  onResultsClick: (e: React.MouseEvent<HTMLDivElement>) => any;
  tokenSymbol?: string;
  totalVoteCount: number;
  voteInformation: Array<VoteInformation>;
  pollEnded: boolean;
  votedFor: string;
  isPreview: boolean;
};

export const ResultsSection = ({
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
    <div className="ResultsSection">
      {!isPreview && (
        <div className="results-header">
          <CWText type="b1" fontWeight="bold">
            {resultString}
          </CWText>
          <CWText
            type="caption"
            className={getClasses<{ clickable?: boolean }>({
              clickable: onResultsClick && hasVotes,
            })}
            onClick={
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

export type PollCardProps = PollOptionProps &
  CastVoteProps &
  ResultsSectionProps & {
    hasVoted?: boolean;
    incrementalVoteCast?: number;
    proposalTitle?: string;
  };

export const PollCard = ({
  disableVoteButton = false,
  incrementalVoteCast,
  isPreview = false,
  multiSelect,
  onResultsClick,
  onVoteCast,
  pollEnded,
  proposalTitle,
  timeRemaining,
  tokenSymbol,
  tooltipErrorMessage,
  votedFor,
  voteInformation,
  ...props
}: PollCardProps) => {
  const [hasVoted, setHasVoted] = useState(props.hasVoted);
  const [selectedOptions, setSelectedOptions] = useState<Array<string>>([]);
  const [totalVoteCount, setTotalVoteCount] = useState(props.totalVoteCount);
  const [voteDirectionString, setVoteDirectionString] = useState(
    votedFor ? buildVoteDirectionString(votedFor) : ''
  );

  const resultString = 'Results';

  const castVote = async () => {
    if (
      multiSelect ||
      selectedOptions[0] === votedFor ||
      selectedOptions.length === 0
    ) {
      // TODO: Build this out when multiple vote options are introduced.
      return;
    }

    await onVoteCast(
      selectedOptions[0],
      () => {
        if (!votedFor) {
          setTotalVoteCount(totalVoteCount + incrementalVoteCast);
        }
        setVoteDirectionString(buildVoteDirectionString(selectedOptions[0]));
        setHasVoted(true);
      },
      selectedOptions.length === 0
    );
  };

  return (
    <CWCard className="PollCard">
      <CWText type="b2" className="poll-title-text">
        {proposalTitle}
      </CWText>
      <div className="poll-voting-section">
        {!hasVoted && !pollEnded && !isPreview && (
          <>
            <PollOptions
              multiSelect={multiSelect}
              voteInformation={voteInformation}
              selectedOptions={selectedOptions}
              disableVoteOptions={disableVoteButton}
            />
            <CastVoteSection
              disableVoteButton={
                disableVoteButton || selectedOptions.length === 0
              }
              timeRemaining={timeRemaining}
              tooltipErrorMessage={tooltipErrorMessage}
              onVoteCast={castVote}
            />
          </>
        )}
        {((hasVoted && !isPreview) || pollEnded) && (
          <VoteDisplay
            timeRemaining={timeRemaining}
            voteDirectionString={voteDirectionString}
            pollEnded={pollEnded}
            voteInformation={voteInformation}
          />
        )}
      </div>
      <ResultsSection
        resultString={resultString}
        onResultsClick={onResultsClick}
        tokenSymbol={tokenSymbol}
        voteInformation={voteInformation}
        pollEnded={pollEnded}
        totalVoteCount={totalVoteCount}
        votedFor={votedFor}
        isPreview={isPreview}
      />
    </CWCard>
  );
};
