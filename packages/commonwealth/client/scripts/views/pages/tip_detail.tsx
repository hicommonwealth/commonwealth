/* @jsx jsx */
import React from 'react';

import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import type { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { DepositVote } from 'models';
import type { IBalanceAccount } from 'models/interfaces';
import { ClassComponent, ResultNode, redraw, jsx } from 'mithrilInterop';

import 'pages/tip_detail.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWTextInput } from '../components/component_kit/cw_text_input';
import { MarkdownFormattedText } from '../components/quill/markdown_formatted_text';
import { User } from '../components/user/user';
import { createTXModal } from '../modals/tx_signing_modal';
import Sublayout from '../sublayout';

type TipDetailAttrs = {
  headerTitle: string;
  proposal: SubstrateTreasuryTip;
  setTipAmount: (tip?: number) => void;
  tipAmount: number;
};

export class TipDetail extends ClassComponent<TipDetailAttrs> {
  view(vnode: ResultNode<TipDetailAttrs>) {
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
        <div className="TipDetail">
          <div className="tip-details">
            <div className="title">{title}</div>
            <div className="proposal-page-row">
              <div className="label">Finder</div>
              <User user={author} linkify popover showAddressWithDisplayName />
            </div>
            <div className="proposal-page-row">
              <div className="label">Beneficiary</div>
              <User
                user={app.profiles.getProfile(proposal.author.chain.id, who)}
                linkify
                popover
                showAddressWithDisplayName
              />
            </div>
            <div className="proposal-page-row">
              <div className="label">Reason</div>
              <div className="tip-reason">
                {reason && <MarkdownFormattedText doc={reason} />}
              </div>
            </div>
            <div className="proposal-page-row">
              <div className="label">Amount</div>
              <div className="amount">
                <div className="denominator">{proposal.support.denom}</div>
                <div>{proposal.support.inDollars}</div>
              </div>
            </div>
          </div>
          <div className="tip-contributions">
            {proposal.canVoteFrom(
              app.user.activeAccount as SubstrateAccount
            ) && (
              <div className="contribute">
                <div className="title">Contribute</div>
                <div className="mb-12">
                  <div className="label">Amount</div>
                  <CWTextInput
                    name="amount"
                    placeholder="Enter tip amount"
                    onInput={(e) => {
                      const result = (e.target as any).value;
                      setTipAmount(
                        result.length > 0
                          ? app.chain.chain.coins(parseFloat(result), true)
                          : undefined
                      );
                      redraw();
                    }}
                  />
                </div>
                <CWButton
                  disabled={tipAmount === undefined}
                  label="Submit Transaction"
                  onClick={(e) => {
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
                />
              </div>
            )}
            {contributors.length > 0 && (
              <>
                <div className="contributors title">Contributors</div>
                {contributors.map(({ account, deposit }) => (
                  <div className="contributors-row">
                    <div className="amount">
                      <div className="denominator">{deposit.denom}</div>
                      <div>{deposit.inDollars}</div>
                    </div>
                    <User
                      user={account}
                      linkify
                      popover
                      showAddressWithDisplayName
                    />
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
