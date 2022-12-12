/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWRadioGroup } from '../../components/component_kit/cw_radio_group';
import EdgewareFunctionPicker from '../../components/edgeware_function_picker';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ChainBase } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';

type SubstrateDemocracyProposalFormAttrs = {
  onChangeSlugEnum: (slug: any) => void;
};

export class SubstrateDemocracyProposalForm extends ClassComponent<SubstrateDemocracyProposalFormAttrs> {
  private deposit;
  private toggleValue;

  oncreate() {
    this.toggleValue = 'proposal';
  }

  view(vnode: m.Vnode<SubstrateDemocracyProposalFormAttrs>) {
    const { onChangeSlugEnum } = vnode.attrs;

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
            onChangeSlugEnum(value);
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
            // createNewProposal(this, typeEnum, author, onChangeSlugEnum);
          }}
        />
      </>
    );
  }
}
