import m from 'mithril';
import moment from 'moment';
import _ from 'lodash';
import app from 'state';
import { formatLastUpdated, formatTimestamp } from 'helpers';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { Tag } from 'construct-ui/lib/esm/components/tag';
import { navigateToSubpage } from '../../../app';

const ProposalRow: m.Component<
  { snapshotId: string; proposal: SnapshotProposal },
  { expanded: boolean }
> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    if (!proposal) return;
    const proposalLink = `/snapshot/${vnode.attrs.snapshotId}/${proposal.id}`;

    const time = moment(+proposal.end * 1000);
    const now = moment();

    // TODO: display proposal.scores and proposal.scores_total on card
    return m('.ProposalCard', [
      m(
        '.proposal-card-top',
        {
          onclick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            localStorage[`${app.activeChainId()}-proposals-scrollY`] =
              window.scrollY;
            navigateToSubpage(proposalLink);
          },
        },
        [
          m('.proposal-card-metadata', [
            m(Tag, {
              label: `${proposal.ipfs.slice(0, 6)}...${proposal.ipfs.slice(
                proposal.ipfs.length - 6
              )}`,
              intent: 'primary',
              rounded: true,
              size: 'xs',
            }),
            m('.proposal-title', proposal.title),
          ]),
          m('.proposal-status', [
            now > time
              ? `Ended ${formatLastUpdated(time)}`
              : `Ending in ${formatTimestamp(moment(+proposal.end * 1000))}`,
          ]),
        ]
      ),
    ]);
  },
};

export default ProposalRow;
