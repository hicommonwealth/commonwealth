/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { NearSputnikProposalKind } from 'controllers/chain/near/sputnik/types';
import { notifyError } from 'controllers/app/notifications';
import NearSputnik from 'controllers/chain/near/sputnik/adapter';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';

enum SupportedSputnikProposalTypes {
  AddMemberToRole = 'Add Member',
  RemoveMemberFromRole = 'Remove Member',
  Transfer = 'Payout',
  Vote = 'Poll',
}

export class SputnikProposalForm extends ClassComponent {
  private description: string;
  private member: string;
  private payoutAmount: string;
  private sputnikProposalType: SupportedSputnikProposalTypes;
  private tokenId: string;

  oninit() {
    this.sputnikProposalType = SupportedSputnikProposalTypes.AddMemberToRole;
  }

  view() {
    return (
      <>
        <CWDropdown
          label="Proposal Type"
          defaultValue={SupportedSputnikProposalTypes.AddMemberToRole}
          options={Object.values(SupportedSputnikProposalTypes).map((v) => ({
            label: v,
          }))}
          onSelect={(result: SupportedSputnikProposalTypes) => {
            this.sputnikProposalType = result;
          }}
        />
        {this.sputnikProposalType !== SupportedSputnikProposalTypes.Vote && (
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
        {this.sputnikProposalType ===
          SupportedSputnikProposalTypes.Transfer && (
          <CWTextInput
            label="Token ID (leave blank for Ⓝ)"
            defaultValue=""
            oninput={(e) => {
              this.tokenId = e.target.value;
            }}
          />
        )}
        {this.sputnikProposalType ===
          SupportedSputnikProposalTypes.Transfer && (
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

            if (
              this.sputnikProposalType ===
              SupportedSputnikProposalTypes.AddMemberToRole
            ) {
              propArgs = {
                AddMemberToRole: { role: 'council', member_id: member },
              };
            } else if (
              this.sputnikProposalType ===
              SupportedSputnikProposalTypes.RemoveMemberFromRole
            ) {
              propArgs = {
                RemoveMemberFromRole: { role: 'council', member_id: member },
              };
            } else if (
              this.sputnikProposalType ===
              SupportedSputnikProposalTypes.Transfer
            ) {
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
            } else if (
              this.sputnikProposalType === SupportedSputnikProposalTypes.Vote
            ) {
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
