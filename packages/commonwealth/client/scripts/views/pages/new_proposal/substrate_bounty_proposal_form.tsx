/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  ChainBase,
  ProposalType,
} from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateBountyProposalForm extends ClassComponent {
  private form: {
    // amount;
    beneficiary;
    // description;
    reason;
    title;
    // topicId;
    // topicName;
    value;
  };

  view() {
    const author = app.user.activeAccount;

    let dataLoaded;
    const bountyTreasury = (app.chain as Substrate).bounties;
    dataLoaded = !!bountyTreasury.initialized;

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
        <CWTextInput
          placeholder="Bounty title (stored on chain)"
          label="Title"
          oninput={(e) => {
            const result = (e.target as any).value;
            this.form.title = result;
            m.redraw();
          }}
        />
        <CWTextInput
          label={`Value (${app.chain.chain.denom})`}
          placeholder="Amount allocated to bounty"
          oninput={(e) => {
            const result = (e.target as any).value;
            this.form.value = app.chain.chain.coins(parseFloat(result), true);
            m.redraw();
          }}
        />
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

            if (!this.form.title) {
              throw new Error('Invalid title');
            }

            if (!this.form.value) {
              throw new Error('Invalid value');
            }

            if (!this.form.reason) {
              throw new Error('Invalid reason');
            }

            if (!this.form.beneficiary) {
              throw new Error('Invalid beneficiary address');
            }

            const beneficiary = app.chain.accounts.get(this.form.beneficiary);

            args = [
              this.form.reason,
              beneficiary,
              author,
              this.form.value,
              this.form.title,
            ];

            // createFunc = ([a, v, t]) =>
            //   (app.chain as Substrate).bounties.createTx(a, v, t);
            // return createTXModal(createFunc(args));

            // Promise.resolve(createFunc(args)).then((modalData) =>
            //   createTXModal(modalData)
            // );
          }}
        />
      </>
    );
  }
}
