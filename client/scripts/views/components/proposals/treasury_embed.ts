import 'components/proposals/treasury_embed.scss';

import $ from 'jquery';
import m from 'mithril';
import { Button } from 'construct-ui';
import { AddressInfo } from 'models';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { idToProposal } from 'identifiers';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import SubstrateDemocracyProposal from 'controllers/chain/substrate/democracy_proposal';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import User from 'views/components/widgets/user';

const TreasuryEmbed: m.Component<{ proposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!(proposal instanceof SubstrateDemocracyProposal
          || proposal instanceof SubstrateDemocracyReferendum
          || proposal instanceof SubstrateCollectiveProposal)) return;

    // only show TreasuryEmbed if this is a proposal that passes a treasury spend
    let treasuryProposalIndex;
    const call = proposal instanceof SubstrateDemocracyProposal ? proposal.preimage
      : proposal instanceof SubstrateDemocracyReferendum ? proposal.preimage
        : proposal instanceof SubstrateCollectiveProposal ? proposal.call : null;

    if (call?.section === 'treasury' && (call.method === 'approveProposal' || call.method === 'rejectProposal')) {
      treasuryProposalIndex = call.args[0];
    } else {
      return;
    }

    try {
      const treasuryProposal = idToProposal('treasuryproposal', +treasuryProposalIndex);
      return m('.TreasuryEmbed', [
        m('p', [
          m('strong', [
            `Treasury Proposal ${treasuryProposalIndex}`,
          ]),
        ]),
        m('p', [
          'Awards ',
          formatCoin(treasuryProposal.value),
          ' to ',
          m(User, {
            user: new AddressInfo(null, treasuryProposal.beneficiaryAddress, app.activeChainId(), null),
            linkify: true,
          }),
        ]),
        app.activeChainId() && m(Button, {
          href: `/${app.activeChainId()}/proposal/treasuryproposal/${treasuryProposalIndex}`,
          onclick: (e) => {
            e.preventDefault();
            m.route.set(`/${app.activeChainId()}/proposal/treasuryproposal/${treasuryProposalIndex}`);
          },
          intent: 'primary',
          label: 'Go to proposal',
          fluid: true,
          rounded: true,
          style: 'margin-top: 4px; margin-bottom: 14px;',
        }),
      ]);
    } catch (e) {
      // TODO: catch error
    }
  }
};

export default TreasuryEmbed;
