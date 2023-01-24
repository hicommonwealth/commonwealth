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

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ProposalType } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateTreasuryProposalForm extends ClassComponent {
  private amount: number;
  private beneficiary: string;

  view() {
    const author = app.user.activeAccount;
    const substrate = app.chain as Substrate;

    if (!substrate.treasury.initialized) {
      if (substrate.chain?.timedOut) {
        return <ErrorPage message="Could not connect to chain" />;
      } else {
        return <CWSpinner />;
      }
    }

    return (
      <React.Fragment>
        <CWTextInput
          title="Beneficiary"
          placeholder="Beneficiary of proposal"
          defaultValue={author.address}
          onInput={(e) => {
            this.beneficiary = e.target.value;
          }}
        />
        <CWTextInput
          label={`Amount (${app.chain.chain.denom})`}
          placeholder="Amount of proposal"
          onInput={(e) => {
            this.amount = app.chain.chain.coins(
              parseFloat(e.target.value),
              true
            );
          }}
        />
        <CWText>
          Bond:{' '}
          {app.chain.chain
            .coins(
              Math.max(
                (this.amount || 0) * substrate.treasury.bondPct,
                substrate.treasury.bondMinimum.inDollars
              ),
              true
            )
            .format()}
          {substrate.treasury.bondPct * 100}% of requested amount minimum{' '}
          {substrate.treasury.bondMinimum.format()}
        </CWText>
        <CWButton
          label="Send transaction"
          onClick={(e) => {
            e.preventDefault();

            const createFunc: (
              ...args
            ) => ITXModalData | Promise<ITXModalData> = (a) => {
              return (
                proposalSlugToClass().get(
                  ProposalType.SubstrateTreasuryProposal
                ) as ProposalModule<any, any, any>
              ).createTx(...a);
            };

            if (!this.beneficiary) {
              throw new Error('Invalid beneficiary address');
            }

            const beneficiary = app.chain.accounts.get(this.beneficiary);

            const args = [author, this.amount, beneficiary];

            Promise.resolve(createFunc(args)).then((modalData) =>
              createTXModal(modalData)
            );
          }}
        />
      </React.Fragment>
    );
  }
}
