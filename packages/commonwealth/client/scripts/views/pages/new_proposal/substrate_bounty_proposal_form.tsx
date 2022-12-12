/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ChainBase } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';

export class SubstrateBountyProposalForm extends ClassComponent {
  private form: {
    // amount;
    // beneficiary;
    // description;
    // reason;
    title;
    // topicId;
    // topicName;
    value;
  };

  view() {
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
            // createNewProposal(this, typeEnum, author, onChangeSlugEnum);
          }}
        />
      </>
    );
  }
}
