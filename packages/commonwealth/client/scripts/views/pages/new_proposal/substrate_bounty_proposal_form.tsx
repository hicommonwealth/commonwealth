/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ProposalType } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateBountyProposalForm extends ClassComponent {
  private title: string;
  private value: string;

  view() {
    const author = app.user.activeAccount;
    const substrate = app.chain as Substrate;

    if (!substrate.bounties.initialized) {
      if (substrate.chain?.timedOut) {
        return <ErrorPage message="Could not connect to chain" />;
      } else {
        return <CWSpinner />;
      }
    }

    return (
      <>
        <CWTextInput
          placeholder="Bounty title (stored on chain)"
          label="Title"
          oninput={(e) => {
            this.title = e.target.value;
          }}
        />
        <CWTextInput
          label={`Value (${app.chain.chain.denom})`}
          placeholder="Amount allocated to bounty"
          oninput={(e) => {
            this.value = app.chain.chain.coins(
              parseFloat(e.target.value),
              true
            );
          }}
        />
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            if (!this.title) {
              throw new Error('Invalid title');
            }

            if (!this.value) {
              throw new Error('Invalid value');
            }

            let createFunc: (...args) => ITXModalData | Promise<ITXModalData> =
              (a) => {
                return (
                  proposalSlugToClass().get(
                    ProposalType.AaveProposal
                  ) as ProposalModule<any, any, any>
                ).createTx(...a);
              };

            const args = [author, this.value, this.title];

            createFunc = ([a, v, t]) => substrate.bounties.createTx(a, v, t);

            return createTXModal(createFunc(args));
          }}
        />
      </>
    );
  }
}
