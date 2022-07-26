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
};

export class PollOptions implements m.ClassComponent<PollOptionAttrs> {
  view(vnode) {
    const { multiSelect, voteInformation, selectedOptions } = vnode.attrs;
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
              />
            ))}
      </div>
    );
  }
}

export type CastVoteAttrs = {
  disableVoteButton: boolean;
  timeRemainingString: string;
  onVoteCast: () => any;
};

export class CastVoteSection implements m.ClassComponent<CastVoteAttrs> {
  view(vnode) {
    const { disableVoteButton, timeRemainingString, onVoteCast } = vnode.attrs;
    return (
      <div class="CastVoteSection">
        <CWButton
          label="Vote"
          buttonType="mini"
          disabled={disableVoteButton}
          onclick={onVoteCast}
        />
        <CWText className="time-remaining-text" type="caption">
          {timeRemainingString}
        </CWText>
      </div>
    );
  }
}

export type VoteDisplayAttrs = {
  timeRemainingString: string;
  voteDirectionString: string;
};

export class VoteDisplay implements m.ClassComponent<VoteDisplayAttrs> {
  view(vnode) {
    const { voteDirectionString, timeRemainingString } = vnode.attrs;
    return (
      <div class="VoteDisplay">
        <div class="vote-direction">
          <CWIcon
            iconName="check"
            iconSize="small"
            className="vote-check-icon"
          />
          <CWText type="caption">{voteDirectionString}</CWText>
        </div>
        <CWText className="time-remaining-text" type="caption">
          {timeRemainingString}
        </CWText>
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
    } = vnode.attrs;
    return (
      <div
        class="ResultsSection"
        onclick={(e) => {
          if (onResultsClick) onResultsClick(e);
        }}
      >
        <div class="results-header">
          <CWText type="b1" fontWeight="bold">
            {resultString}
          </CWText>
          <CWText type="caption" className="results-text">
            {`${Math.floor(totalVoteCount * 100) / 100} ${
              tokenSymbol ?? 'votes'
            }`}
          </CWText>
        </div>
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
              return (
                <CWProgressBar
                  progress={
                    option.voteCount
                      ? (option.voteCount / totalVoteCount) * 100
                      : 0
                  }
                  progressStatus={
                    !pollEnded ? 'ongoing' : index === 0 ? 'passed' : 'neutral'
                  }
                  label={option.label}
                  count={option.voteCount}
                />
              );
            })}
        </div>
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
      timeRemainingString,
      tokenSymbol,
      votedFor,
      voteInformation,
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
        {!pollEnded && (
          <div class="poll-voting-section">
            {!this.hasVoted ? (
              <>
                <PollOptions
                  multiSelect={multiSelect}
                  voteInformation={voteInformation}
                  selectedOptions={this.selectedOptions}
                />
                <CastVoteSection
                  disableVoteButton={
                    disableVoteButton || this.selectedOptions.length === 0
                  }
                  timeRemainingString={timeRemainingString}
                  onVoteCast={castVote}
                />
              </>
            ) : (
              <VoteDisplay
                timeRemainingString={timeRemainingString}
                voteDirectionString={this.voteDirectionString}
              />
            )}
          </div>
        )}
        <ResultsSection
          resultString={resultString}
          onResultsClick={onResultsClick}
          tokenSymbol={tokenSymbol}
          voteInformation={voteInformation}
          pollEnded={pollEnded}
          totalVoteCount={this.totalVoteCount}
        />
      </CWCard>
    );
  }
}
