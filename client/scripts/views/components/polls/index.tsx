/* @jsx m */

import {
  SnapshotProposal,
  SnapshotProposalVote,
} from 'client/scripts/helpers/snapshot_utils';
import { OffchainPoll, OffchainThread } from 'client/scripts/models';
import m from 'mithril';
import 'components/poll_card.scss';
import { CWCard } from '../component_kit/cw_card';
import { CWRadioGroup } from '../component_kit/cw_radio_group';
import { CWButton } from '../component_kit/cw_button';
import {
  CWProgressBar,
  CWProgressBarStatus,
} from '../component_kit/cw_progress_bar';

// Extend as use cases expand.
export const enum PollType {
  Offchain = 'Offchain',
  Snapshot = 'Snapshot',
}
export type PollCardAttrs = {
  pollType: PollType;
  offchainPoll?: OffchainPoll;
  offchainThread: OffchainThread;
  snapshotProposal?: SnapshotProposal;
  snapshotVotes?: SnapshotProposalVote[];
  snapshotSymbol?: string;
};

export class PollCard implements m.ClassComponent<PollCardAttrs> {
  multiSelect: boolean;
  pollEnded: boolean;
  view(vnode) {
    const dummyRadioOptions = [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ];
    return (
      <CWCard elevation="elevation-1">
        <div className="PollCard">
          <div className="poll-title-section">
            <div className="title">
              Temporary Title for the question posed in this proposal
            </div>
          </div>
          {!this.pollEnded && (
            <div className="poll-voting-section">
              <div className="vote-options">
                {this.multiSelect ? (
                  <div className="multi-select-votes"></div>
                ) : (
                  <div className="single-select-votes">
                    <CWRadioGroup
                      name="what"
                      options={dummyRadioOptions}
                      toggledOption="Yes"
                      onchange={() => {
                        console.log('changed');
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="cast-vote-section">
                <CWButton label="Vote" buttonType="mini" />
                <div className="time-remaining-text">3 days 4hr remaining</div>
              </div>
            </div>
          )}
          <div className="poll-results-section">
            <div className="results-header">
              <div className="results">
                {this.pollEnded ? 'Passed' : 'Results'}
              </div>
              <div className="total-count">23 votes</div>
            </div>
            <div className="results-content">
              {dummyRadioOptions.map((option) => {
                return (
                  <div className="progress-bar-wrapper">
                    <CWProgressBar
                      className="results-progress-bar"
                      progress={20.5}
                      progressStatus={CWProgressBarStatus.neutral}
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
