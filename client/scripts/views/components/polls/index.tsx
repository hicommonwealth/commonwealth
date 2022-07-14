/* @jsx m */

import {
  SnapshotProposal,
  SnapshotProposalVote,
} from 'client/scripts/helpers/snapshot_utils';
import { OffchainPoll, OffchainThread } from 'client/scripts/models';
import m from 'mithril';
import 'styles/components/poll_card.scss';
import { CWCard } from '../component_kit/cw_card';

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
  view(vnode) {
    return (
      <CWCard elevation="elevation-1">
        <div className="PollCard">
          <div className="poll-title-section"></div>
          <div className="poll-voting-section"></div>
          <div className="poll-results-section"></div>
        </div>
      </CWCard>
    );
  }
}
