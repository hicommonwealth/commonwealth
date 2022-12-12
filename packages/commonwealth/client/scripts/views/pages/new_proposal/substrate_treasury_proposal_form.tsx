/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  ChainBase,
  ProposalType,
} from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateTreasuryProposalForm extends ClassComponent {
  private form: {
    amount;
    beneficiary;
    // description;
    // reason;
    // title;
    // topicId;
    // topicName;
    // value;
  };

  view() {
    const author = app.user.activeAccount;

    let dataLoaded;
    const treasury = (app.chain as Substrate).treasury;
    dataLoaded = !!treasury.initialized;

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
          title="Beneficiary"
          placeholder="Beneficiary of proposal"
          defaultValue={author.address}
          oncreate={() => {
            this.form.beneficiary = author.address;
          }}
          oninput={(e) => {
            const result = (e.target as any).value;
            this.form.beneficiary = result;
            m.redraw();
          }}
        />
        <CWTextInput
          label={`Amount (${app.chain.chain.denom})`}
          placeholder="Amount of proposal"
          oninput={(e) => {
            const result = (e.target as any).value;
            this.form.amount = app.chain.chain.coins(parseFloat(result), true);
            m.redraw();
          }}
        />
        <CWText>
          Bond:{' '}
          {app.chain.chain
            .coins(
              Math.max(
                (this.form.amount?.inDollars || 0) *
                  (app.chain as Substrate).treasury.bondPct,
                (app.chain as Substrate).treasury.bondMinimum.inDollars
              ),
              true
            )
            .format()}
          {(app.chain as Substrate).treasury.bondPct * 100}% of requested amount
          minimum {(app.chain as Substrate).treasury.bondMinimum.format()}
        </CWText>
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

            let args = [];

            if (!this.form.beneficiary) {
              throw new Error('Invalid beneficiary address');
            }

            const beneficiary = app.chain.accounts.get(this.form.beneficiary);

            args = [author, this.form.amount, beneficiary];

            Promise.resolve(createFunc(args)).then((modalData) =>
              createTXModal(modalData)
            );
          }}
        />
      </>
    );
  }
}
