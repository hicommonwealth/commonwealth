/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWText } from '../../components/component_kit/cw_text';
import { ChainBase } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';

export class PhragmenCandidacyForm extends ClassComponent {
  view() {
    let dataLoaded;
    const elections = (app.chain as Substrate).phragmenElections;
    dataLoaded = !!elections.initialized;

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
        <CWText>
          Becoming a candidate requires a deposit of
          {formatCoin((app.chain as Substrate).phragmenElections.candidacyBond)}
          . It will be returned if you are elected, or carried over to the next
          election if you are in the top{' '}
          {(app.chain as Substrate).phragmenElections.desiredRunnersUp}{' '}
          runners-up.
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
