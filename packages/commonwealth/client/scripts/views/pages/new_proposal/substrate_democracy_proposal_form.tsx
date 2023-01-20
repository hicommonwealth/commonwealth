/* @jsx m */

import { blake2AsHex } from '@polkadot/util-crypto';
import ClassComponent from 'class_component';
import { notifyError } from 'controllers/app/notifications';
import type { SubstrateAccount } from 'controllers/chain/substrate/account';
import type Substrate from 'controllers/chain/substrate/adapter';
import { proposalSlugToClass } from 'identifiers';
import m from 'mithril';
import type { ITXModalData, ProposalModule } from 'models';

import app from 'state';
import { ProposalType } from '../../../../../../common-common/src/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import EdgewareFunctionPicker from '../../components/edgeware_function_picker';
import { createTXModal } from '../../modals/tx_signing_modal';
import ErrorPage from '../error';

export class SubstrateDemocracyProposalForm extends ClassComponent {
  private deposit: number;
  private toggleValue: string;

  oninit() {
    this.toggleValue = 'proposal';
  }

  view() {
    const author = app.user.activeAccount as SubstrateAccount;
    const substrate = app.chain as Substrate;

    let dataLoaded;

    if (!author.isCouncillor) {
      dataLoaded = false;
    } else {
      dataLoaded = !!substrate.democracyProposals?.initialized;
    }

    if (!dataLoaded) {
      if (substrate.chain?.timedOut) {
        return <ErrorPage message="Could not connect to chain" />;
      } else {
        return <CWSpinner />;
      }
    }

    const formState = { module: '', function: '', args: [] };

    return (
      <>
        <CWRadioGroup
          name="democracy-tx-switcher"
          onchange={(value) => {
            this.toggleValue = value;
          }}
          toggledOption="proposal"
          options={[
            { label: 'Create Proposal', value: 'proposal' },
            { label: 'Upload Preimage', value: 'preimage' },
            {
              label: 'Upload Imminent Preimage',
              value: 'imminent',
            },
          ]}
        />
        {m(EdgewareFunctionPicker, formState)}
        {this.toggleValue === 'proposal' && (
          <CWTextInput
            label={`Deposit (${app.chain.currency})`}
            placeholder={`Min: ${substrate.democracyProposals.minimumDeposit.inDollars}`}
            defaultValue={substrate.democracyProposals.minimumDeposit.inDollars}
            oninput={(e) => {
              this.deposit = parseFloat(e.target.value);
            }}
          />
        )}
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            let createFunc: (
              ...args
            ) => ITXModalData | Promise<ITXModalData> = (a) => {
              return (
                proposalSlugToClass().get(
                  ProposalType.SubstrateDemocracyProposal
                ) as ProposalModule<any, any, any>
              ).createTx(...a);
            };

            let args = [];

            const deposit = this.deposit
              ? app.chain.chain.coins(this.deposit, true)
              : substrate.democracyProposals.minimumDeposit;

            if (!EdgewareFunctionPicker.getMethod(formState)) {
              notifyError('Missing arguments');
            } else if (this.toggleValue === 'proposal') {
              const proposalHash = blake2AsHex(
                EdgewareFunctionPicker.getMethod(formState).toHex()
              );

              args = [
                author,
                EdgewareFunctionPicker.getMethod(formState),
                proposalHash,
                deposit,
              ];

              createFunc = ([au, mt, pr, dep]) =>
                substrate.democracyProposals.createTx(au, mt, pr, dep);
            } else if (this.toggleValue === 'preimage') {
              const encodedProposal =
                EdgewareFunctionPicker.getMethod(formState).toHex();

              args = [
                author,
                EdgewareFunctionPicker.getMethod(formState),
                encodedProposal,
              ];

              createFunc = ([au, mt, pr]) =>
                substrate.democracyProposals.notePreimage(au, mt, pr);
            } else if (this.toggleValue === 'imminent') {
              const encodedProposal =
                EdgewareFunctionPicker.getMethod(formState).toHex();

              args = [
                author,
                EdgewareFunctionPicker.getMethod(formState),
                encodedProposal,
              ];

              createFunc = ([au, mt, pr]) =>
                substrate.democracyProposals.noteImminentPreimage(au, mt, pr);
            } else {
              throw new Error('Invalid toggle state');
            }

            Promise.resolve(createFunc(args)).then((modalData) =>
              createTXModal(modalData)
            );
          }}
        />
      </>
    );
  }
}
