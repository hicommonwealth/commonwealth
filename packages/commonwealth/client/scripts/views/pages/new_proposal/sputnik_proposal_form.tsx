/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import { NearSputnikProposalKind } from 'controllers/chain/near/sputnik/types';
import { notifyError } from 'controllers/app/notifications';
import NearSputnik from 'controllers/chain/near/sputnik/adapter';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { SupportedSputnikProposalTypes } from './types';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWButton } from '../../components/component_kit/cw_button';
import { ProposalType } from '../../../../../../common-common/src/types';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SputnikProposalForm extends ClassComponent {
  private description;
  private member;
  private payoutAmount;
  private sputnikProposalType;
  private tokenId;

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
            name: 'proposalType',
            label: v,
            value: v,
          }))}
          onSelect={(result) => {
            this.sputnikProposalType = result;
            m.redraw();
          }}
        />
        {this.sputnikProposalType !== SupportedSputnikProposalTypes.Vote && (
          <CWTextInput
            label="Member"
            defaultValue="tokenfactory.testnet"
            // oncreate={() => {
            //   this.member = 'tokenfactory.testnet';
            // }}
            oninput={(e) => {
              const result = (e.target as any).value;
              this.member = result;
              m.redraw();
            }}
          />
        )}
        <CWTextInput
          label="Description"
          // defaultValue=''
          // oncreate={() => {
          //   this.description = '';
          // }}
          oninput={(e) => {
            const result = (e.target as any).value;
            this.description = result;
            m.redraw();
          }}
        />
        {this.sputnikProposalType ===
          SupportedSputnikProposalTypes.Transfer && (
          <CWTextInput
            label="Token ID (leave blank for Ⓝ)"
            // defaultValue: '',
            // oncreate: () => {
            //   this.tokenId = '';
            // },
            oninput={(e) => {
              const result = (e.target as any).value;
              this.tokenId = result;
              m.redraw();
            }}
          />
        )}
        {this.sputnikProposalType ===
          SupportedSputnikProposalTypes.Transfer && (
          <CWTextInput
            label="Amount"
            // defaultValue: '',
            // oncreate: () => {
            //   this.payoutAmount = '';
            // },
            oninput={(e) => {
              const result = (e.target as any).value;
              this.payoutAmount = result;
              m.redraw();
            }}
          />
        )}
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            const createFunc: (
              ...args
            ) => ITXModalData | Promise<ITXModalData> = (a) => {
              return (
                proposalSlugToClass().get(
                  ProposalType.AaveProposal
                ) as ProposalModule<any, any, any>
              ).createTx(...a);
            };

            const args = [];

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
              const token_id = this.tokenId || '';

              let amount: string;
              // treat NEAR as in dollars but tokens as whole #s
              if (!token_id) {
                amount = app.chain.chain
                  .coins(+this.payoutAmount, true)
                  .asBN.toString();
              } else {
                amount = `${+this.payoutAmount}`;
              }

              propArgs = {
                Transfer: { receiver_id: member, token_id, amount },
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

            Promise.resolve(createFunc(args)).then((modalData) =>
              createTXModal(modalData)
            );
          }}
        />
      </>
    );
  }
}
