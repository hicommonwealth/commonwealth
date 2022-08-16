/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'components/proposal_card/index.scss';

import app from 'state';
import { formatLastUpdated, formatTimestamp } from 'helpers';
import { SnapshotProposal } from 'helpers/snapshot_utils';
import { navigateToSubpage } from '../../../app';
import { CWCard } from '../../components/component_kit/cw_card';
import { ProposalTag } from '../../components/proposal_card/proposal_tag';

export class SnapshotProposalCard
  implements
    m.ClassComponent<{
      snapshotId: string;
      proposal: SnapshotProposal;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    if (!proposal) return;
    const proposalLink = `/snapshot/${vnode.attrs.snapshotId}/${proposal.id}`;

    const time = moment(+proposal.end * 1000);
    const now = moment();

    // TODO: display proposal.scores and proposal.scores_total on card
    return (
      <CWCard
        elevation="elevation-2"
        interactive={true}
        className="ProposalCard"
        onclick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          localStorage[`${app.activeChainId()}-proposals-scrollY`] =
            window.scrollY;
          navigateToSubpage(proposalLink);
        }}
      >
        <div class="proposal-card-metadata">
          <ProposalTag
            label={`${proposal.ipfs.slice(0, 6)}...${proposal.ipfs.slice(
              proposal.ipfs.length - 6
            )}`}
          />
          <div class="proposal-title">{proposal.title}</div>
        </div>
        <div class="proposal-status">
          {now > time
            ? `Ended ${formatLastUpdated(time)}`
            : `Ending in ${formatTimestamp(moment(+proposal.end * 1000))}`}
        </div>
      </CWCard>
    );
  }
}
