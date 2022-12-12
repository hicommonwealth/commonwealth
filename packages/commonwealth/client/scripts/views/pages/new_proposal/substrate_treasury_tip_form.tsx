/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWLabel } from '../../components/component_kit/cw_label';
import User from '../../components/widgets/user';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { CWTextArea } from '../../components/component_kit/cw_text_area';
import {
  ChainBase,
  ProposalType,
} from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateTreasuryTipForm extends ClassComponent {
  private form: {
    // amount;
    beneficiary;
    description;
    // reason;
    // title;
    // topicId;
    // topicName;
    // value;
  };

  view() {
    const author = app.user.activeAccount;

    let dataLoaded = true;
    // TODO: this is only true if the proposer is doing reportAwesome()
    //   we need special code for newTip().
    const tips = (app.chain as Substrate).tips;
    dataLoaded = !!tips.initialized;

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
        <CWLabel label="Finder" />,
        {m(User, {
          user: author,
          linkify: true,
          popover: true,
          showAddressWithDisplayName: true,
        })}
        <CWTextInput
          label="Beneficiary"
          placeholder="Beneficiary of treasury proposal"
          oninput={(e) => {
            const result = (e.target as any).value;
            this.form.beneficiary = result;
            m.redraw();
          }}
        />
        <CWTextArea
          label="Reason"
          placeholder="What’s the reason you want to tip the beneficiary?"
          oninput={(e) => {
            const result = (e.target as any).value;
            if (this.form.description !== result) {
              this.form.description = result;
            }
            m.redraw();
          }}
        />
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

            args = [author, this.form.description, beneficiary];

            Promise.resolve(createFunc(args)).then((modalData) =>
              createTXModal(modalData)
            );
          }}
        />
      </>
    );
  }
}
