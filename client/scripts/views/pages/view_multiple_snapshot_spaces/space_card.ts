import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import app from 'state';
import { formatLastUpdated, formatTimestamp } from 'helpers';
import { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { Tag } from 'construct-ui/lib/esm/components/tag';
import { navigateToSubpage } from '../../../app';
import { REDIRECT_ACTIONS } from '.';
import { OffchainThread } from 'client/scripts/models';

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
            `/new/snapshot/${app.chain.meta.chain.snapshot}` +
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
