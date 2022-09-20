/* @jsx m */

import m from 'mithril';

import 'components/poll_card.scss';

import { CWCard } from './component_kit/cw_card';
import { CWButton } from './component_kit/cw_button';
import { CWProgressBar } from './component_kit/cw_progress_bar';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import { CWCheckbox } from './component_kit/cw_checkbox';
import { CWRadioButton } from './component_kit/cw_radio_button';
import { CWText } from './component_kit/cw_text';
import { CWTooltip } from './component_kit/cw_popover/cw_tooltip';
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

export type PollOptionAttrs = {
  multiSelect: boolean;
  voteInformation: Array<VoteInformation>;
  selectedOptions: Array<string>;
  disableVoteOptions: boolean;
};

export class PollOptions implements m.ClassComponent<PollOptionAttrs> {
  view(vnode) {
    const {
      multiSelect,
      voteInformation,
      selectedOptions,
      disableVoteOptions,
    } = vnode.attrs;
    return (
      <div class="PollOptions">
        {multiSelect
          ? voteInformation.map((option) => (
              <CWCheckbox
                checked={false}
                label={option.label}
                onchange={() => {
                  // TODO: Build this out when multiple vote options are introduced.
                  // Something like: this.selectedOptions.push(option.value);
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
                onchange={() => {
                  selectedOptions[0] = option.value;
                }}
                label={option.label}
                value={option.value}
                disabled={disableVoteOptions}
              />
            ))}
      </div>
    );
  }
}

export type CastVoteAttrs = {
  disableVoteButton: boolean;
  timeRemaining: string;
  tooltipErrorMessage: string;
  onVoteCast: () => any;
};

export class CastVoteSection implements m.ClassComponent<CastVoteAttrs> {
  view(vnode) {
    const {
      disableVoteButton,
      timeRemaining,
      onVoteCast,
      tooltipErrorMessage,
    } = vnode.attrs;
    return (
      <div class="CastVoteSection">
        {disableVoteButton ? (
          <CWTooltip
            interactionType="hover"
            tooltipContent={tooltipErrorMessage ?? 'Select an option to vote.'}
            tooltipType="solidNoArrow"
            hoverCloseDelay={300}
            trigger={
              <CWButton
                label="Vote"
                buttonType="mini-black"
                disabled={disableVoteButton}
                onclick={onVoteCast}
              />
            }
          />
        ) : (
          <CWButton
            label="Vote"
            buttonType="mini-black"
            disabled={disableVoteButton}
            onclick={onVoteCast}
          />
        )}
        <CWText className="time-remaining-text" type="caption">
          {timeRemaining}
        </CWText>
      </div>
    );
  }
}

export type VoteDisplayAttrs = {
  timeRemaining: string;
  voteDirectionString: string;
  pollEnded: string;
  voteInformation: Array<VoteInformation>;
};

export class VoteDisplay implements m.ClassComponent<VoteDisplayAttrs> {
  view(vnode) {
    const { voteDirectionString, timeRemaining, pollEnded, voteInformation } =
      vnode.attrs;

    const topResponse = voteInformation.sort(
      (option1, option2) => option2.voteCount - option1.voteCount
    )[0].label;

    return (
      <div class="VoteDisplay">
        {!pollEnded ? (
          <>
            <div class="vote-direction">
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
          <div class="completed-vote-information">
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
  }
}

export type ResultsSectionAttrs = {
  resultString: string;
  onResultsClick: () => any;
  tokenSymbol: string;
  totalVoteCount: number;
  voteInformation: Array<VoteInformation>;
  pollEnded: boolean;
  votedFor: string;
  isPreview: boolean;
};

export class ResultsSection implements m.ClassComponent<ResultsSectionAttrs> {
  view(vnode) {
    const {
      resultString,
      onResultsClick,
      totalVoteCount,
      tokenSymbol,
      voteInformation,
      pollEnded,
      votedFor,
      isPreview,
    } = vnode.attrs;

    const calculateProgressStatus = (
      option: VoteInformation,
      index: number
    ) => {
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
      <div class="ResultsSection">
        {!isPreview && (
          <div class="results-header">
            <CWText type="b1" fontWeight="bold">
              {resultString}
            </CWText>
            <CWText
              type="caption"
              className={getClasses<{ clickable?: boolean }>({
                clickable: onResultsClick && hasVotes,
              })}
              onclick={
                onResultsClick && hasVotes
                  ? (e) => onResultsClick(e)
                  : undefined
              }
            >
              {`${Math.floor(totalVoteCount * 100) / 100} ${
                tokenSymbol ?? 'votes'
              }`}
            </CWText>
          </div>
        )}
        <div class="results-content">
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
                  count={option.voteCount}
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
  }
}

export type PollCardAttrs = PollOptionAttrs &
  CastVoteAttrs &
  ResultsSectionAttrs;

export class PollCard implements m.ClassComponent<PollCardAttrs> {
  private hasVoted: boolean;
  private selectedOptions: Array<string>;
  private totalVoteCount: number;
  private voteDirectionString: string;

  oninit(vnode) {
    // Initialize state which can change during the lifecycle of the component.
    this.hasVoted = vnode.attrs.hasVoted;
    this.voteDirectionString = vnode.attrs.votedFor
      ? buildVoteDirectionString(vnode.attrs.votedFor)
      : '';
    this.totalVoteCount = vnode.attrs.totalVoteCount;
    this.selectedOptions = [];
  }

  view(vnode) {
    const {
      disableVoteButton = false,
      incrementalVoteCast,
      multiSelect,
      onResultsClick,
      onVoteCast,
      pollEnded,
      proposalTitle,
      timeRemaining,
      tokenSymbol,
      votedFor,
      voteInformation,
      tooltipErrorMessage,
      isPreview = false,
    } = vnode.attrs;

    const resultString = 'Results';

    const castVote = async () => {
      if (
        multiSelect ||
        this.selectedOptions[0] === votedFor ||
        this.selectedOptions.length === 0
      ) {
        // TODO: Build this out when multiple vote options are introduced.
        return;
      }

      await onVoteCast(
        this.selectedOptions[0],
        this.selectedOptions.length === 0,
        () => {
          if (!votedFor) {
            this.totalVoteCount += incrementalVoteCast;
          }
          this.voteDirectionString = buildVoteDirectionString(
            this.selectedOptions[0]
          );
          this.hasVoted = true;
        }
      );
      m.redraw();
    };

    return (
      <CWCard className="PollCard">
        <CWText type="b2" className="poll-title-text">
          {proposalTitle}
        </CWText>
        <div class="poll-voting-section">
          {!this.hasVoted && !pollEnded && !isPreview && (
            <>
              <PollOptions
                multiSelect={multiSelect}
                voteInformation={voteInformation}
                selectedOptions={this.selectedOptions}
                disableVoteOptions={disableVoteButton}
              />
              <CastVoteSection
                disableVoteButton={
                  disableVoteButton || this.selectedOptions.length === 0
                }
                timeRemaining={timeRemaining}
                tooltipErrorMessage={tooltipErrorMessage}
                onVoteCast={castVote}
              />
            </>
          )}
          {((this.hasVoted && !isPreview) || pollEnded) && (
            <VoteDisplay
              timeRemaining={timeRemaining}
              voteDirectionString={this.voteDirectionString}
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
          totalVoteCount={this.totalVoteCount}
          votedFor={votedFor}
          isPreview={isPreview}
        />
      </CWCard>
    );
  }
}
