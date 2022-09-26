/* @jsx m */

import m from 'mithril';

import 'pages/tip_detail.scss';

import app from 'state';
import { DepositVote } from 'models';
import { IBalanceAccount } from 'models/interfaces';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import Sublayout from '../sublayout';
import User from '../components/widgets/user';
import { MarkdownFormattedText } from '../components/quill/markdown_formatted_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { CWButton } from '../components/component_kit/cw_button';
import { createTXModal } from '../modals/tx_signing_modal';

export class TipDetail
  implements
    m.ClassComponent<{
      headerTitle: string;
      proposal: SubstrateTreasuryTip;
      setTipAmount: () => void;
      tipAmount: number;
    }>
{
  view(vnode) {
    const { headerTitle, proposal, setTipAmount, tipAmount } = vnode.attrs;

    const {
      author,
      title,
      data: { who, reason },
    } = proposal;

    const contributors = proposal.getVotes();

    return m(
      Sublayout,
      {
        showNewProposalButton: true,
        title: headerTitle,
      },
      [
        m('.TipDetailPage', [
          m('.tip-details', [
            m('.title', title),
            m('.proposal-page-row', [
              m('.label', 'Finder'),
              m(User, {
                user: author,
                linkify: true,
                popover: true,
                showAddressWithDisplayName: true,
              }),
            ]),
            m('.proposal-page-row', [
              m('.label', 'Beneficiary'),
              m(User, {
                user: app.profiles.getProfile(proposal.author.chain.id, who),
                linkify: true,
                popover: true,
                showAddressWithDisplayName: true,
              }),
            ]),
            m('.proposal-page-row', [
              m('.label', 'Reason'),
              m('.tip-reason', [m(MarkdownFormattedText, { doc: reason })]),
            ]),
            m('.proposal-page-row', [
              m('.label', 'Amount'),
              m('.amount', [
                m('.denominator', proposal.support.denom),
                m('', proposal.support.inDollars),
              ]),
            ]),
          ]),
          m('.tip-contributions', [
            proposal.canVoteFrom(app.user.activeAccount as SubstrateAccount) &&
              m('.contribute', [
                m('.title', 'Contribute'),
                m('.mb-12', [
                  m('.label', 'Amount'),
                  <CWTextInput
                    name="amount"
                    placeholder="Enter tip amount"
                    oninput={(e) => {
                      const result = (e.target as any).value;
                      setTipAmount(
                        result.length > 0
                          ? app.chain.chain.coins(parseFloat(result), true)
                          : undefined
                      );
                      m.redraw();
                    }}
                  />,
                ]),
                <CWButton
                  disabled={tipAmount === undefined}
                  label="Submit Transaction"
                  onclick={(e) => {
                    e.preventDefault();
                    createTXModal(
                      proposal.submitVoteTx(
                        new DepositVote(
                          app.user.activeAccount as IBalanceAccount<any>,
                          app.chain.chain.coins(tipAmount)
                        )
                      )
                    );
                  }}
                />,
              ]),
            contributors.length > 0 && [
              m('.contributors .title', 'Contributors'),
              contributors.map(({ account, deposit }) =>
                m('.contributors-row', [
                  m('.amount', [
                    m('.denominator', deposit.denom),
                    m('', deposit.inDollars),
                  ]),
                  m(User, {
                    user: account,
                    linkify: true,
                    popover: true,
                    showAddressWithDisplayName: true,
                  }),
                ])
              ),
            ],
          ]),
        ]),
      ]
    );
  }
}
