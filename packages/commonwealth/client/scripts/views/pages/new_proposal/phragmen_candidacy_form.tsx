/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import { formatCoin } from 'adapters/currency';
import type Substrate from 'controllers/chain/substrate/adapter';
import { proposalSlugToClass } from 'identifiers';
import type { ITXModalData, ProposalModule } from 'models';

import app from 'state';
import { ProposalType } from '../../../../../../common-common/src/types';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { createTXModal } from '../../modals/tx_signing_modal';
import ErrorPage from '../error';

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
          onClick={(e) => {
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
