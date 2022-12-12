/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { Account } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ChainBase } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';

type SubstrateTreasuryProposalFormAttrs = {
  author: Account;
};

export class SubstrateTreasuryProposalForm extends ClassComponent<SubstrateTreasuryProposalFormAttrs> {
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

  view(vnode: m.Vnode<SubstrateTreasuryProposalFormAttrs>) {
    const { author } = vnode.attrs;

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
            // createNewProposal(this, typeEnum, author, onChangeSlugEnum);
          }}
        />
      </>
    );
  }
}
