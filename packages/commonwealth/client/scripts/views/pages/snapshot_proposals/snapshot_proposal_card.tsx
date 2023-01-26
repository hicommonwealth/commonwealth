/* @jsx m */

import ClassComponent from 'class_component';

import 'components/proposal_card/index.scss';
import { formatLastUpdated, formatTimestamp } from 'helpers';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import m from 'mithril';
import moment from 'moment';

import app from 'state';
import { navigateToSubpage } from '../../../app';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';
import { ProposalTag } from '../../components/proposal_card/proposal_tag';

type SnapshotProposalCardAttrs = {
  snapshotId: string;
  proposal: SnapshotProposal;
};

export class SnapshotProposalCard extends ClassComponent<SnapshotProposalCardAttrs> {
  view(vnode: m.Vnode<SnapshotProposalCardAttrs>) {
    const { proposal } = vnode.attrs;

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
          if (app.chain) {
            localStorage[`${app.activeChainId()}-proposals-scrollY`] =
              window.scrollY;
            navigateToSubpage(proposalLink);
          } else {
            navigateToSubpage(proposalLink);
          }
        }}
      >
        <div class="proposal-card-metadata">
          <ProposalTag
            label={`${proposal.ipfs.slice(0, 6)}...${proposal.ipfs.slice(
              proposal.ipfs.length - 6
            )}`}
          />
          <CWText title={proposal.title} fontWeight="semiBold" noWrap>
            {proposal.title}
          </CWText>
        </div>
        <CWText>
          {now > time
            ? `Ended ${formatLastUpdated(time)}`
            : `Ending in ${formatTimestamp(moment(+proposal.end * 1000))}`}
        </CWText>
      </CWCard>
    );
  }
}
