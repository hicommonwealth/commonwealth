import m from 'mithril';
import { OffchainThread } from 'client/scripts/models';
import app from 'state';
import { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { navigateToSubpage } from '../../../app';
import { REDIRECT_ACTIONS } from '.';

function countActiveProposals(proposals: SnapshotProposal[]): number {
  return proposals.filter((proposal) => proposal.state === 'active').length;
}

const SnapshotSpaceCard: m.Component<
  {
    space: SnapshotSpace;
    proposals: SnapshotProposal[];
    redirect_action: string;
    proposal: null | OffchainThread;
  },
  {}
> = {
  view: (vnode) => {
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

    return m('.SnapshotSpaceCard', [
      m(
        '.spaces-card-top',
        {
          onclick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            handleClicks();
          },
        },
        [
          m('.spaces-card-metadata', [
            m('.spaces-title', [space.name]),
            m('.card-subheader', [space.id]),
          ]),
          m('.space-status', [
            `${num_active_proposals} Active Proposal${
              num_active_proposals == 1 ? '' : 's'
            }`,
          ]),
        ]
      ),
    ]);
  },
};

export default SnapshotSpaceCard;
