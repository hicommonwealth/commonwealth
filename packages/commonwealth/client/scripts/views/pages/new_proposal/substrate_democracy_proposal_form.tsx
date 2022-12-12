/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import { blake2AsHex } from '@polkadot/util-crypto';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import { notifyError } from 'controllers/app/notifications';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import EdgewareFunctionPicker from '../../components/edgeware_function_picker';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  ChainBase,
  ProposalType,
} from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateDemocracyProposalForm extends ClassComponent {
  private deposit;
  private toggleValue;

  oncreate() {
    this.toggleValue = 'proposal';
  }

  view() {
    const author = app.user.activeAccount;

    let dataLoaded;

    if (!(app.user.activeAccount as SubstrateAccount).isCouncillor) {
      dataLoaded = false;
    }

    if (this.toggleValue === 'proposal') {
      dataLoaded = !!(app.chain as Substrate).democracyProposals?.initialized;
    }

    if (!dataLoaded) {
      if (
        app.chain?.base === ChainBase.Substrate &&
        (app.chain as Substrate).chain?.timedOut
      ) {
        return <ErrorPage message="Could not connect to chain" />;
      } else {
        return <CWSpinner />;
      }
    }

    return (
      <>
        <CWRadioGroup
          name="democracy-tx-switcher"
          onchange={async (value) => {
            this.toggleValue = value;
            m.redraw();
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
        {m(EdgewareFunctionPicker)}
        {this.toggleValue === 'proposal' && (
          <CWTextInput
            label={`Deposit (${
              app.chain.base === ChainBase.Substrate
                ? app.chain.currency
                : (app.chain as Cosmos).governance.minDeposit.denom
            })`}
            placeholder={`Min: ${
              app.chain.base === ChainBase.Substrate
                ? (app.chain as Substrate).democracyProposals.minimumDeposit
                    .inDollars
                : +(app.chain as Cosmos).governance.minDeposit
            }`}
            oncreate={(vvnode) =>
              $(vvnode.dom).val(
                app.chain.base === ChainBase.Substrate
                  ? (app.chain as Substrate).democracyProposals.minimumDeposit
                      .inDollars
                  : +(app.chain as Cosmos).governance.minDeposit
              )
            }
            oninput={(e) => {
              const result = (e.target as any).value;
              this.deposit = parseFloat(result);
              m.redraw();
            }}
          />
        )}
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            let createFunc: (...args) => ITXModalData | Promise<ITXModalData> =
              (a) => {
                return (
                  proposalSlugToClass().get(
                    ProposalType.AaveProposal
                  ) as ProposalModule<any, any, any>
                ).createTx(...a);
              };

            let args = [];

            const deposit = this.deposit
              ? app.chain.chain.coins(this.deposit, true)
              : (app.chain as Substrate).democracyProposals.minimumDeposit;

            if (!EdgewareFunctionPicker.getMethod()) {
              notifyError('Missing arguments');
            } else if (this.toggleValue === 'proposal') {
              const proposalHash = blake2AsHex(
                EdgewareFunctionPicker.getMethod().toHex()
              );

              args = [
                author,
                EdgewareFunctionPicker.getMethod(),
                proposalHash,
                deposit,
              ];

              createFunc = ([au, mt, pr, dep]) =>
                (app.chain as Substrate).democracyProposals.createTx(
                  au,
                  mt,
                  pr,
                  dep
                );
            } else if (this.toggleValue === 'preimage') {
              const encodedProposal =
                EdgewareFunctionPicker.getMethod().toHex();

              args = [
                author,
                EdgewareFunctionPicker.getMethod(),
                encodedProposal,
              ];

              createFunc = ([au, mt, pr]) =>
                (app.chain as Substrate).democracyProposals.notePreimage(
                  au,
                  mt,
                  pr
                );
            } else if (this.toggleValue === 'imminent') {
              const encodedProposal =
                EdgewareFunctionPicker.getMethod().toHex();

              args = [
                author,
                EdgewareFunctionPicker.getMethod(),
                encodedProposal,
              ];

              createFunc = ([au, mt, pr]) =>
                (
                  app.chain as Substrate
                ).democracyProposals.noteImminentPreimage(au, mt, pr);
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
