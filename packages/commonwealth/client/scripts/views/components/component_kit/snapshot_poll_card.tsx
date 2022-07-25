/* @jsx m */

import m from 'mithril';
import _ from 'lodash';

import 'components/poll_card.scss';

import { CWCard } from './cw_card';
import { CWButton } from './cw_button';
import { CWProgressBar } from './cw_progress_bar';
import { CWIcon } from './cw_icons/cw_icon';
import { CWCheckbox } from './cw_checkbox';
import { CWRadioButton } from './cw_radio_button';
import { CWText } from './cw_text';

export const enum PollOptionResult {}

export type VoteInformation = {
  label: string;
  value: string;
  voteCount: number;
};

export type SnapshotPollCardAttrs = {
  pollEnded: boolean;
  hasVoted: boolean;
  votedFor: string;
  proposalTitle: string;
  timeRemainingString: string;
  totalVoteCount: number;
  voteInformation: VoteInformation[];
  onVoteCast: () => any;
  disableVoteButton: boolean;
  incrementalVoteCast: number;
  tokenSymbol: string;
};

export function buildVoteDirectionString(voteOption: string) {
  return `You voted "${voteOption}"`;
}
export class SnapshotPollCard
  implements m.ClassComponent<SnapshotPollCardAttrs>
{
  hasVoted: boolean; // keep
  voteDirectionString: string; // keep
  totalVoteCount: number; // keep
  selectedOptions: string[];

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
      pollEnded,
      proposalTitle,
      votedFor,
      timeRemainingString,
      voteInformation,
      onVoteCast,
      disableVoteButton = false,
      tokenSymbol,
      incrementalVoteCast,
    } = vnode.attrs;

    const resultString = 'Results';

    return (
      <CWCard elevation="elevation-1" className="poll-card">
        <div class="poll-card-content">
          <CWText type="b2" className="poll-title-section">
            {proposalTitle}
          </CWText>
          {!pollEnded && (
            <div class="poll-voting-section">
              {!this.hasVoted ? (
                <>
                  <div class="vote-options">
                    <div class="single-select-votes">
                      {voteInformation.map((option) => (
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
                  </div>
                  <div class="cast-vote-section">
                    <CWButton
                      label="Vote"
                      buttonType="mini"
                      disabled={disableVoteButton}
                      onclick={async () => {
                        try {
                          await onVoteCast(this.selectedOptions[0], () => {
                            if (!votedFor) {
                              this.totalVoteCount += incrementalVoteCast;
                            }
                            this.voteDirectionString = buildVoteDirectionString(
                              this.selectedOptions[0]
                            );
                            this.hasVoted = true;
                          });
                        } catch (e) {
                          console.log(e);
                        }
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
                    <CWIcon iconName="check" iconSize="small" />
                    <CWText type="caption" className="vote-direction-string">
                      {this.voteDirectionString}
                    </CWText>
                  </div>
                  <CWText className="time-remaining-text" type="caption">
                    {timeRemainingString}
                  </CWText>
                </div>
              )}
            </div>
          )}
          <div class="poll-results-section">
            <div class="results-header">
              <CWText type="b1" fontWeight="bold">
                {resultString}
              </CWText>
              <CWText type="caption" className="results">
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
                    <div class="progress-bar-wrapper">
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
                        progressHeight={4}
                        label={option.label}
                        count={option.voteCount}
                        token={tokenSymbol ?? ''}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </CWCard>
    );
  }
}
