/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import { Any as ProtobufAny } from 'cosmjs-types/google/protobuf/any';

import app from 'state';
import { navigateToSubpage } from 'app';
import CosmosAccount from 'controllers/chain/cosmos/account';
import { notifyError } from 'controllers/app/notifications';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWLabel } from '../../components/component_kit/cw_label';

export class CosmosProposalForm extends ClassComponent {
  private cosmosProposalType: 'textProposal' | 'communitySpend';
  private deposit: number;
  private description: string;
  private payoutAmount: string;
  private recipient: string;
  private title: string;

  oninit() {
    this.cosmosProposalType = 'textProposal';
  }

  view() {
    const author = app.user.activeAccount as CosmosAccount;
    const cosmos = app.chain as Cosmos;

    return !cosmos.governance.initialized ? (
      <CWSpinner />
    ) : (
      <>
        <CWLabel label="Proposal Type" />
        <CWRadioGroup
          name="cosmos-proposal-type"
          onchange={(value) => {
            this.cosmosProposalType = value;
          }}
          toggledOption="textProposal"
          options={[
            { label: 'Text Proposal', value: 'textProposal' },
            { label: 'Community Spend', value: 'communitySpend' },
          ]}
        />
        <CWTextInput
          placeholder="Enter a title"
          label="Title"
          oninput={(e) => {
            this.title = e.target.value;
          }}
        />
        <CWTextArea
          label="Description"
          placeholder="Enter a description"
          oninput={(e) => {
            this.description = e.target.value;
          }}
        />
        <CWTextInput
          label={`Deposit (${cosmos.governance.minDeposit.denom})`}
          placeholder={`Min: ${+cosmos.governance.minDeposit}`}
          defaultValue={+cosmos.governance.minDeposit}
          oninput={(e) => {
            this.deposit = +e.target.value;
          }}
        />
        {this.cosmosProposalType !== 'textProposal' && (
          <CWTextInput
            label="Recipient"
            placeholder={app.user.activeAccount.address}
            defaultValue=""
            oninput={(e) => {
              this.recipient = e.target.value;
            }}
          />
        )}
        {this.cosmosProposalType !== 'textProposal' && (
          <CWTextInput
            label={`Amount (${cosmos.governance.minDeposit.denom})`}
            placeholder="12345"
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

            let prop: ProtobufAny;

            const { title, description } = this;

            const deposit = this.deposit
              ? new CosmosToken(
                  cosmos.governance.minDeposit.denom,
                  this.deposit,
                  false
                )
              : cosmos.governance.minDeposit;
            if (this.cosmosProposalType === 'textProposal') {
              prop = cosmos.governance.encodeTextProposal(title, description);
            } else if (this.cosmosProposalType === 'communitySpend') {
              prop = cosmos.governance.encodeCommunitySpend(
                title,
                description,
                this.recipient,
                this.payoutAmount
              );
            } else {
              throw new Error('Unknown Cosmos proposal type.');
            }
            // TODO: add disabled / loading
            cosmos.governance
              .submitProposalTx(author, deposit, prop)
              .then((result) => {
                navigateToSubpage(`/proposal/${result}`);
              })
              .catch((err) => notifyError(err.message));
          }}
        />
      </>
    );
  }
}
