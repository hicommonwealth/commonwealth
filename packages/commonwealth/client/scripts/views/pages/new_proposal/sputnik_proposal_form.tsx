/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import type { NearSputnikProposalKind } from 'controllers/chain/near/sputnik/types';
import { notifyError } from 'controllers/app/notifications';
import type NearSputnik from 'controllers/chain/near/sputnik/adapter';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';

const sputnikProposalOptions = [
  {
    label: 'Add Member',
    value: 'addMember',
  },
  {
    label: 'Remove Member',
    value: 'removeMember',
  },
  {
    label: 'Payout',
    value: 'payout',
  },
  {
    label: 'Poll',
    value: 'poll',
  },
];

export class SputnikProposalForm extends ClassComponent {
  private description: string;
  private member: string;
  private payoutAmount: string;
  private sputnikProposalType: string;
  private tokenId: string;

  oninit() {
    this.sputnikProposalType = sputnikProposalOptions[0].value;
  }

  view() {
    return (
      <>
        <CWDropdown
          label="Proposal Type"
          defaultValue={sputnikProposalOptions[0]}
          options={sputnikProposalOptions}
          onSelect={(item) => {
            this.sputnikProposalType = item.value;
          }}
        />
        {this.sputnikProposalType !== 'vote' && (
          <CWTextInput
            label="Member"
            defaultValue="tokenfactory.testnet"
            oninput={(e) => {
              this.member = e.target.value;
            }}
          />
        )}
        <CWTextInput
          label="Description"
          defaultValue=""
          oninput={(e) => {
            this.description = e.target.value;
          }}
        />
        {this.sputnikProposalType === 'payout' && (
          <CWTextInput
            label="Token ID (leave blank for Ⓝ)"
            defaultValue=""
            oninput={(e) => {
              this.tokenId = e.target.value;
            }}
          />
        )}
        {this.sputnikProposalType === 'payout' && (
          <CWTextInput
            label="Amount"
            defaultValue=""
            oninput={(e) => {
              this.payoutAmount = e.target.value;
            }}
          />
        )}
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            // TODO: make type of proposal switchable
            const member = this.member;

            const description = this.description;

            let propArgs: NearSputnikProposalKind;

            if (this.sputnikProposalType === 'addMember') {
              propArgs = {
                AddMemberToRole: { role: 'council', member_id: member },
              };
            } else if (this.sputnikProposalType === 'removeMember') {
              propArgs = {
                RemoveMemberFromRole: { role: 'council', member_id: member },
              };
            } else if (this.sputnikProposalType === 'payout') {
              // TODO: validate amount / token id
              const tokenId = this.tokenId || '';

              let amount: string;
              // treat NEAR as in dollars but tokens as whole #s
              if (!tokenId) {
                amount = app.chain.chain
                  .coins(+this.payoutAmount, true)
                  .asBN.toString();
              } else {
                amount = `${+this.payoutAmount}`;
              }

              propArgs = {
                Transfer: { receiver_id: member, token_id: tokenId, amount },
              };
            } else if (this.sputnikProposalType === 'vote') {
              propArgs = 'Vote';
            } else {
              throw new Error('unsupported sputnik proposal type');
            }

            (app.chain as NearSputnik).dao
              .proposeTx(description, propArgs)
              .then(() => m.redraw())
              .catch((err) => notifyError(err.message));
          }}
        />
      </>
    );
  }
}
