/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import { Any as ProtobufAny } from 'cosmjs-types/google/protobuf/any';

import app from 'state';
import { navigateToSubpage } from 'app';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import CosmosAccount from 'controllers/chain/cosmos/account';
import { notifyError } from 'controllers/app/notifications';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { SupportedCosmosProposalTypes } from './types';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWButton } from '../../components/component_kit/cw_button';
import { ProposalType } from '../../../../../../common-common/src/types';
import { createTXModal } from '../../modals/tx_signing_modal';

export class CosmosProposalForm extends ClassComponent {
  private cosmosProposalType;
  private deposit;
  private form: {
    amount;
    beneficiary;
    description;
    reason;
    title;
    topicId;
    topicName;
    value;
  };
  private payoutAmount;
  private recipient;

  oninit() {
    this.cosmosProposalType = SupportedCosmosProposalTypes.Text;
  }

  view() {
    const author = app.user.activeAccount;
    let dataLoaded = true;
    dataLoaded = !!(app.chain as Cosmos).governance.initialized;

    return (
      <>
        <CWDropdown
          label="Proposal Type"
          initialValue={SupportedCosmosProposalTypes.Text}
          options={[]}
          //   options={Object.values(SupportedCosmosProposalTypes).map((v) => ({
          //     name: 'proposalType',
          //     label: v,
          //     value: v,
          //   }))}
          onSelect={(result) => {
            this.cosmosProposalType = result;
            m.redraw();
          }}
        />
        <CWTextInput
          placeholder="Enter a title"
          label="Title"
          oninput={(e) => {
            const result = (e.target as any).value;
            this.form.title = result;
            m.redraw();
          }}
        />
        <CWTextArea
          label="Description"
          placeholder="Enter a description"
          oninput={(e) => {
            const result = (e.target as any).value;
            if (this.form.description !== result) {
              this.form.description = result;
            }
            m.redraw();
          }}
        />
        <CWTextInput
          label={`Deposit (${
            (app.chain as Cosmos).governance.minDeposit.denom
          })`}
          placeholder={`Min: ${+(app.chain as Cosmos).governance.minDeposit}`}
          // oncreate={(vvnode) =>
          //   $(vvnode.dom).val(
          //     +(app.chain as Cosmos).governance.minDeposit
          //   )}
          oninput={(e) => {
            const result = (e.target as any).value;
            this.deposit = +result;
            m.redraw();
          }}
        />
        {this.cosmosProposalType !== SupportedCosmosProposalTypes.Text && (
          <CWTextInput
            label="Recipient"
            placeholder={app.user.activeAccount.address}
            // defaultValue: '',
            // oncreate: () => {
            //   this.recipient = '';
            // },
            oninput={(e) => {
              const result = (e.target as any).value;
              this.recipient = result;
              m.redraw();
            }}
          />
        )}
        {this.cosmosProposalType !== SupportedCosmosProposalTypes.Text && (
          <CWTextInput
            label={`Amount (${
              (app.chain as Cosmos).governance.minDeposit.denom
            })`}
            placeholder="12345"
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

            let prop: ProtobufAny;

            const { title, description } = this.form;

            const deposit = this.deposit
              ? new CosmosToken(
                  (app.chain as Cosmos).governance.minDeposit.denom,
                  this.deposit,
                  false
                )
              : (app.chain as Cosmos).governance.minDeposit;
            if (this.cosmosProposalType === SupportedCosmosProposalTypes.Text) {
              prop = (app.chain as Cosmos).governance.encodeTextProposal(
                title,
                description
              );
            } else if (
              this.cosmosProposalType ===
              SupportedCosmosProposalTypes.CommunitySpend
            ) {
              prop = (app.chain as Cosmos).governance.encodeCommunitySpend(
                title,
                description,
                this.recipient,
                this.payoutAmount
              );
            } else {
              throw new Error('Unknown Cosmos proposal type.');
            }
            // TODO: add disabled / loading
            (app.chain as Cosmos).governance
              .submitProposalTx(author as CosmosAccount, deposit, prop)
              .then((result) => {
                navigateToSubpage(`/proposal/${result}`);
              })
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
