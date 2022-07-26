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

type VoteInformation = {
  label: string;
  value: string;
  voteCount: number;
};

export type SharedPollCardAttrs = {
  disableVoteButton: boolean;
  hasVoted: boolean;
  incrementalVoteCast: number;
  onVoteCast: () => any;
  pollEnded: boolean;
  proposalTitle: string;
  timeRemainingString: string;
  totalVoteCount: number;
  votedFor: string;
  voteInformation: Array<VoteInformation>;
  multiSelect?: boolean;
  onResultsClick?: () => any;
  tokenSymbol?: string;
};

export function buildVoteDirectionString(voteOption: string) {
  return `You voted "${voteOption}"`;
}

export class PollCard implements m.ClassComponent<SharedPollCardAttrs> {
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

    return (
      <CWCard className="PollCard">
        <CWText type="b2" className="poll-title-text">
          {proposalTitle}
        </CWText>
        {!pollEnded && (
          <div class="poll-voting-section">
            {!this.hasVoted ? (
              <>
                <div class="vote-options">
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
                            this.selectedOptions.length > 0 &&
                            option.value === this.selectedOptions[0]
                          }
                          groupName="votes"
                          onchange={() => {
                            this.selectedOptions[0] = option.value;
                          }}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                </div>
                <div class="cast-vote-section">
                  <CWButton
                    label="Vote"
                    buttonType="mini"
                    disabled={disableVoteButton}
                    onclick={async () => {
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
                    }}
                  />
                  <CWText className="time-remaining-text" type="caption">
                    {timeRemainingString}
                  </CWText>
                </div>
              </>
            ) : (
              <div class="voted-display">
                <div class="vote-direction">
                  <CWIcon
                    iconName="check"
                    iconSize="small"
                    className="vote-check-icon"
                  />
                  <CWText type="caption">{this.voteDirectionString}</CWText>
                </div>
                <CWText className="time-remaining-text" type="caption">
                  {timeRemainingString}
                </CWText>
              </div>
            )}
          </div>
        )}
        <div class="poll-results-section" onclick={(e) => onResultsClick(e)}>
          <div class="results-header">
            <CWText type="b1" fontWeight="bold">
              {resultString}
            </CWText>
            <CWText type="caption" className="results-text">
              {`${Math.floor(this.totalVoteCount * 100) / 100} ${
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
                        ? (option.voteCount / this.totalVoteCount) * 100
                        : 0
                    }
                    progressStatus={
                      !pollEnded
                        ? 'ongoing'
                        : index === 0
                        ? 'passed'
                        : 'neutral'
                    }
                    label={option.label}
                    count={option.voteCount}
                  />
                );
              })}
          </div>
        </div>
      </CWCard>
    );
  }
}
