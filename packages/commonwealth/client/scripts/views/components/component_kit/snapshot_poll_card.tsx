/* @jsx m */

import m from 'mithril';

import 'components/poll_card.scss';

import { CWCard } from './cw_card';
import { CWButton } from './cw_button';
import { CWProgressBar } from './cw_progress_bar';
import { CWIcon } from './cw_icons/cw_icon';
import { CWRadioButton } from './cw_radio_button';
import { CWText } from './cw_text';

export type VoteInformation = {
  label: string;
  value: string;
  voteCount: number;
};

export type SnapshotPollCardAttrs = {
  disableVoteButton: boolean;
  hasVoted: boolean;
  incrementalVoteCast: number;
  onVoteCast: () => any;
  pollEnded: boolean;
  proposalTitle: string;
  timeRemainingString: string;
  tokenSymbol: string;
  totalVoteCount: number;
  votedFor: string;
  voteInformation: Array<VoteInformation>;
};

export function buildVoteDirectionString(voteOption: string) {
  return `You voted "${voteOption}"`;
}

export class SnapshotPollCard
  implements m.ClassComponent<SnapshotPollCardAttrs>
{
  hasVoted: boolean; // keep
  selectedOptions: Array<string>;
  totalVoteCount: number; // keep
  voteDirectionString: string; // keep

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
      <CWCard className="poll-card">
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
                    <CWText type="caption" className="vote-direction-text">
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
                      subtext={`${Math.min(
                        100,
                        Math.floor(option.voteCount * 1000) / 1000
                      )} ${tokenSymbol}`}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </CWCard>
    );
  }
}
