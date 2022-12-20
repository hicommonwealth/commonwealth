/* @jsx m */

import m from 'mithril';
import { ClassComponent } from 'mithrilInterop';

import 'pages/snapshot/snapshot_space_card.scss';

import { Thread } from 'models';
import app from 'state';
import { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { navigateToSubpage } from '../../../app';
import { REDIRECT_ACTIONS } from '.';
import { CWCard } from '../../components/component_kit/cw_card';

function countActiveProposals(proposals: SnapshotProposal[]): number {
  return proposals.filter((proposal) => proposal.state === 'active').length;
}

type SnapshotSpaceCardAttrs = {
  proposal: null | Thread;
  proposals: SnapshotProposal[];
  redirectAction: string;
  space: SnapshotSpace;
};

export class SnapshotSpaceCard extends ClassComponent<SnapshotSpaceCardAttrs> {
  view(vnode: m.Vnode<SnapshotSpaceCardAttrs>) {
    const { space, proposals, redirectAction, proposal } = vnode.attrs;
    if (!space || !proposals) return;

    const numActiveProposals = countActiveProposals(proposals);

    function handleClicks() {
      if (redirectAction === REDIRECT_ACTIONS.ENTER_SPACE) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(`/snapshot/${space.id}`);
        });
      } else if (redirectAction === REDIRECT_ACTIONS.NEW_PROPOSAL) {
        app.snapshot.init(space.id).then(() => {
          navigateToSubpage(`/new/snapshot/${space.id}`);
        });
      } else if (redirectAction === REDIRECT_ACTIONS.NEW_FROM_THREAD) {
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
        interactive
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
            {`${numActiveProposals} Active Proposal${
              numActiveProposals === 1 ? '' : 's'
            }`}
          </div>
        </div>
      </CWCard>
    );
  }
}
