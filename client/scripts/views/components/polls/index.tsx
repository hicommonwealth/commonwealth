/* @jsx m */

import {
  SnapshotProposal,
  SnapshotProposalVote,
} from 'client/scripts/helpers/snapshot_utils';
import { OffchainPoll, OffchainThread } from 'client/scripts/models';
import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import 'components/poll_card.scss';
import { CWCard } from '../component_kit/cw_card';
import { CWRadioGroup } from '../component_kit/cw_radio_group';
import { CWButton } from '../component_kit/cw_button';
import {
  CWProgressBar,
  CWProgressBarStatus,
} from '../component_kit/cw_progress_bar';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWCheckbox } from '../component_kit/cw_checkbox';
import { CWRadioButton } from '../component_kit/cw_radio_button';

// Extend as use cases expand.
export const enum PollType {
  Offchain = 'Offchain',
  Snapshot = 'Snapshot',
}

export const enum PollOptionResult {}

export type VoteInformation = {
  label: string;
  value: string;
  voteCount: number;
  onVoteCast: (value: any) => void;
};

export type PollCardAttrs = {
  pollType: PollType;
  multiSelect: boolean;
  pollEnded: boolean;
  hasVoted: boolean;
  proposalTitle: string;
  timeRemainingString: string;
  voteDirectionString: string;
  totalVoteCount: number;
  voteInformation: VoteInformation[];
  offchainPoll?: OffchainPoll;
  offchainThread?: OffchainThread;
  snapshotProposal?: SnapshotProposal;
  snapshotVotes?: SnapshotProposalVote[];
  snapshotSymbol?: string;
};

export class PollCard implements m.ClassComponent<PollCardAttrs> {
  hasVoted: boolean; // keep
  voteDirectionString: string; // keep
  totalVoteCount: number; // keep

  oninit(vnode) {
    // Initialize state which can change during the lifecycle of the component.
    this.hasVoted = vnode.attrs.hasVoted;
    this.voteDirectionString = vnode.attrs.voteDirectionString;
    this.totalVoteCount = vnode.attrs.totalVoteCount;
  }

  view(vnode) {
    const dummyRadioOptions = [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ];
    const {
      pollType,
      multiSelect,
      pollEnded,
      proposalTitle,
      timeRemainingString,
      voteInformation,
    } = vnode.attrs;

    let resultString;
    if (pollType === PollType.Offchain) {
      resultString = 'Results'; // TODO: handle this and other poll types.
    }

    return (
      <CWCard elevation="elevation-1">
        <div className="PollCard">
          <div className="poll-title-section">
            <div className="title">{proposalTitle}</div>
          </div>
          {!pollEnded && (
            <div className="poll-voting-section">
              {!this.hasVoted ? (
                <>
                  <div className="vote-options">
                    {!multiSelect ? (
                      <div className="multi-select-votes">
                        {dummyRadioOptions.map((option) => (
                          <CWCheckbox
                            checked={false}
                            label={option.label}
                            onchange={() => console.log('wtf')}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="single-select-votes">
                        {dummyRadioOptions.map((option) => (
                          <CWRadioButton
                            checked={false}
                            groupName="votes"
                            onchange={() => console.log('hi')}
                            label={option.label}
                            value={option.value}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="cast-vote-section">
                    <CWButton label="Vote" buttonType="mini" />
                    <div className="time-remaining-text">
                      {timeRemainingString}
                    </div>
                  </div>
                </>
              ) : (
                <div className="voted-display">
                  <div className="vote-direction">
                    <CWIcon iconName="check" iconSize="small" />
                    <div className="vote-direction-text">
                      {this.voteDirectionString}
                    </div>
                  </div>
                  <div className="time-remaining-text">
                    {timeRemainingString}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="poll-results-section">
            <div className="results-header">
              <div className="results">{resultString}</div>
              <div className="total-count">{`${this.totalVoteCount} votes`}</div>
            </div>
            <div className="results-content">
              {voteInformation
                .sort(
                  (option1, option2) => option1.voteCount > option2.voteCount
                )
                .map((option) => {
                  return (
                    <div className="progress-bar-wrapper">
                      <CWProgressBar
                        className="results-progress-bar"
                        progress={
                          option.voteCount
                            ? (option.voteCount / this.totalVoteCount) * 100
                            : 0
                        }
                        progressStatus={CWProgressBarStatus.passed}
                        progressHeight={4}
                        label={option.label}
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
