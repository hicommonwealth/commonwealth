/* @jsx m */

import m from 'mithril';

import 'pages/snapshot/snapshot_space_card.scss';

import { OffchainThread } from 'models';
import app from 'state';
import { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { navigateToSubpage } from '../../../app';
import { REDIRECT_ACTIONS } from '.';
import { CWCard } from '../../components/component_kit/cw_card';

function countActiveProposals(proposals: SnapshotProposal[]): number {
  return proposals.filter((proposal) => proposal.state === 'active').length;
}

export class SnapshotSpaceCard
  implements
    m.ClassComponent<{
      proposal: null | OffchainThread;
      proposals: SnapshotProposal[];
      redirect_action: string;
      space: SnapshotSpace;
    }>
{
  view(vnode) {
    const { space, proposals, redirect_action, proposal } = vnode.attrs;
    if (!space || !proposals) return;

    const num_active_proposals = countActiveProposals(proposals);

    function handleClicks() {
      if (redirect_action === REDIRECT_ACTIONS.ENTER_SPACE) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(`/snapshot/${space.id}`);
        });
      } else if (redirect_action === REDIRECT_ACTIONS.NEW_PROPOSAL) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(`/new/snapshot/${space.id}`);
        });
      } else if (redirect_action === REDIRECT_ACTIONS.NEW_FROM_THREAD) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(
            `/new/snapshot/${app.chain.meta.snapshot}` +
              `?fromProposalType=${proposal.slug}&fromProposalId=${proposal.id}`
          );
        });
      }
    }

    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="SnapshotSpaceCard"
        onclick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleClicks();
        }}
      >
        <div class="space-card-container">
          <div class="space-card-metadata">
            <div class="space-card-title">{space.name}</div>
            <div class="space-card-subheader">{space.id}</div>
          </div>
          <div class="space-card-status">
            {`${num_active_proposals} Active Proposal${
              num_active_proposals === 1 ? '' : 's'
            }`}
          </div>
        </div>
      </CWCard>
    );
  }
}
