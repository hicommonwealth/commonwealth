/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

// import 'pages/new_proposal/compound_proposal_form.scss';

import app from 'state';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { SupportedCosmosProposalTypes } from './types';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWButton } from '../../components/component_kit/cw_button';

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
            // createNewProposal(this, typeEnum, author, onChangeSlugEnum);
          }}
        />
      </>
    );
  }
}
