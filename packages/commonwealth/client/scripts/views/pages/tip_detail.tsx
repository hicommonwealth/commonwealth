/* @jsx m */

import ClassComponent from 'class_component';
import type { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import m from 'mithril';
import { DepositVote } from 'models';
import type { IBalanceAccount } from 'models/interfaces';

import 'pages/tip_detail.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { MarkdownFormattedText } from '../components/quill/markdown_formatted_text';
import User from '../components/widgets/user';
import { createTXModal } from '../modals/tx_signing_modal';
import Sublayout from '../sublayout';

type TipDetailAttrs = {
  headerTitle: string;
  proposal: SubstrateTreasuryTip;
  setTipAmount: (tip?: number) => void;
  tipAmount: number;
};

export class TipDetail extends ClassComponent<TipDetailAttrs> {
  view(vnode: m.Vnode<TipDetailAttrs>) {
    const { headerTitle, proposal, setTipAmount, tipAmount } = vnode.attrs;

    const {
      author,
      title,
      data: { who, reason },
    } = proposal;

    const contributors = proposal.getVotes();

    return (
      <Sublayout
      // title={headerTitle}
      >
        <div class="TipDetail">
          <div class="tip-details">
            <div class="title">{title}</div>
            <div class="proposal-page-row">
              <div class="label">Finder</div>
              {m(User, {
                user: author,
                linkify: true,
                popover: true,
                showAddressWithDisplayName: true,
              })}
            </div>
            <div class="proposal-page-row">
              <div class="label">Beneficiary</div>
              {m(User, {
                user: app.newProfiles.getProfile(proposal.author.chain.id, who),
                linkify: true,
                popover: true,
                showAddressWithDisplayName: true,
              })}
            </div>
            <div class="proposal-page-row">
              <div class="label">Reason</div>
              <div class="tip-reason">
                <MarkdownFormattedText doc={reason} />
              </div>
            </div>
            <div class="proposal-page-row">
              <div class="label">Amount</div>
              <div class="amount">
                <div class="denominator">{proposal.support.denom}</div>
                <div>{proposal.support.inDollars}</div>
              </div>
            </div>
          </div>
          <div class="tip-contributions">
            {proposal.canVoteFrom(app.user.activeAddressAccount) && (
              <div class="contribute">
                <div class="title">Contribute</div>
                <div class="mb-12">
                  <div class="label">Amount</div>
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
                  />
                </div>
                <CWButton
                  disabled={tipAmount === undefined}
                  label="Submit Transaction"
                  onclick={(e) => {
                    e.preventDefault();
                    createTXModal(
                      proposal.submitVoteTx(
                        new DepositVote(
                          app.user.activeAddressAccount as IBalanceAccount<any>,
                          app.chain.chain.coins(tipAmount)
                        )
                      )
                    );
                  }}
                />
              </div>
            )}
            {contributors.length > 0 && (
              <>
                <div class="contributors title">Contributors</div>
                {contributors.map(({ account, deposit }) => (
                  <div class="contributors-row">
                    <div class="amount">
                      <div class="denominator">{deposit.denom}</div>
                      <div>{deposit.inDollars}</div>
                    </div>
                    {m(User, {
                      user: account,
                      linkify: true,
                      popover: true,
                      showAddressWithDisplayName: true,
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Sublayout>
    );
  }
}
