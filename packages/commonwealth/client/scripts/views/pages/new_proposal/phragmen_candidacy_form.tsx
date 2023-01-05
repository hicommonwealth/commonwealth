/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import { formatCoin } from 'adapters/currency';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWText } from '../../components/component_kit/cw_text';
import { ProposalType } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class PhragmenCandidacyForm extends ClassComponent {
  view() {
    const author = app.user.activeAccount;
    const substrate = app.chain as Substrate;

    if (!substrate.phragmenElections.initialized) {
      if (substrate.chain?.timedOut) {
        return <ErrorPage message="Could not connect to chain" />;
      } else {
        return <CWSpinner />;
      }
    }

    return (
      <>
        <CWText>
          Becoming a candidate requires a deposit of
          {formatCoin(substrate.phragmenElections.candidacyBond)}. It will be
          returned if you are elected, or carried over to the next election if
          you are in the top {substrate.phragmenElections.desiredRunnersUp}{' '}
          runners-up.
        </CWText>
        <CWButton
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            let createFunc: (
              ...args
            ) => ITXModalData | Promise<ITXModalData> = (a) => {
              return (
                proposalSlugToClass().get(
                  ProposalType.PhragmenCandidacy
                ) as ProposalModule<any, any, any>
              ).createTx(...a);
            };

            createFunc = ([a]) =>
              substrate.phragmenElections.activeElection.submitCandidacyTx(a);

            Promise.resolve(createFunc([author])).then((modalData) =>
              createTXModal(modalData)
            );
          }}
        />
      </>
    );
  }
}
