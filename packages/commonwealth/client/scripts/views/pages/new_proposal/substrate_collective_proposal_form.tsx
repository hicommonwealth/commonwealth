/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { proposalSlugToClass } from 'identifiers';
import { ITXModalData, ProposalModule } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import EdgewareFunctionPicker from '../../components/edgeware_function_picker';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  ChainBase,
  ProposalType,
} from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateCollectiveProposalForm extends ClassComponent {
  private councilMotionDescription;
  private councilMotionType;
  private enactmentDelay;
  private nextExternalProposalHash;
  private referendumId;
  private threshold;
  private treasuryProposalIndex;
  private votingPeriod;

  view() {
    const author = app.user.activeAccount;
    const motions = SubstrateCollectiveProposal.motions;

    // if (
    //   !(app.user.activeAccount as SubstrateAccount).isCouncillor
    // ) {
    //   dataLoaded = false;
    // }

    let hasExternalProposalSelector;
    let dataLoaded;

    hasExternalProposalSelector =
      this.councilMotionType === 'vetoNextExternal' ||
      this.councilMotionType === 'createFastTrack' ||
      this.councilMotionType === 'createExternalProposalDefault';

    if (hasExternalProposalSelector) {
      dataLoaded = !!(app.chain as Substrate).democracyProposals?.initialized;
    }

    if (!this.councilMotionType) {
      this.councilMotionType = motions[0].name;
      this.councilMotionDescription = motions[0].description;
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
        <CWDropdown
          label="Motion"
          options={motions.map((m_) => ({
            name: 'councilMotionType',
            value: m_.name,
            label: m_.label,
          }))}
          onSelect={(result) => {
            this.councilMotionType = result;
            this.councilMotionDescription = motions.find(
              (m_) => m_.name === result
            ).description;
            m.redraw();
          }}
        />
        {this.councilMotionDescription && (
          <div class="council-motion-description">
            {this.councilMotionDescription}
          </div>
        )}
        {this.councilMotionType === 'createExternalProposal' ||
          (this.councilMotionType === 'createExternalProposalMajority' &&
            m(EdgewareFunctionPicker))}
        {/* {hasExternalProposalSelector &&
          (app.chain as Substrate).democracyProposals.nextExternal && (
            <CWDropdown
              label="Proposal"
              options={{
                value: (
                  app.chain as Substrate
                ).democracyProposals.nextExternal[0].hash.toString(),
                label: `${(
                  app.chain as Substrate
                ).democracyProposals.nextExternal[0].hash
                  .toString()
                  .slice(0, 8)}...`,
              }}
              onSelect={(result) => {
                this.nextExternalProposalHash = result;
                m.redraw();
              }}
            />
          )} */}
        {this.councilMotionType === 'createFastTrack' ||
          (this.councilMotionType === 'createExternalProposalDefault' && (
            <>
              <CWTextInput
                label="Voting Period"
                placeholder="Blocks (minimum enforced)"
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.votingPeriod = +result;
                  m.redraw();
                }}
              />
              <CWTextInput
                label="Enactment Delay"
                placeholder="Blocks (minimum enforced)"
                oninput={(e) => {
                  const result = (e.target as any).value;
                  this.enactmentDelay = +result;
                  m.redraw();
                }}
              />
            </>
          ))}

        {this.councilMotionType === 'createEmergencyCancellation' && (
          <CWDropdown
            label="Referendum"
            options={(app.chain as Substrate).democracy.store
              .getAll()
              .map((r) => ({
                name: 'referendum',
                value: r.identifier,
                label: `${r.shortIdentifier}: ${r.title}`,
              }))}
            onSelect={(result) => {
              this.referendumId = result;
              m.redraw();
            }}
          />
        )}
        {this.councilMotionType === 'createTreasuryApprovalMotion' ||
          (this.councilMotionType === 'createTreasuryRejectionMotion' && (
            <CWDropdown
              label="Treasury Proposal"
              options={(app.chain as Substrate).treasury.store
                .getAll()
                .map((r) => ({
                  name: 'external_proposal',
                  value: r.identifier,
                  label: r.shortIdentifier,
                }))}
              onSelect={(result) => {
                this.treasuryProposalIndex = result;
                m.redraw();
              }}
            />
          ))}

        {this.councilMotionType !== 'vetoNextExternal' && (
          <CWTextInput
            label="Threshold"
            placeholder="How many members must vote yes to execute?"
            oninput={(e) => {
              const result = (e.target as any).value;
              this.threshold = +result;
              m.redraw();
            }}
          />
        )}
        <CWButton
          disabled={!(author as SubstrateAccount).isCouncillor}
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

            if (!this.threshold) throw new Error('Invalid threshold');

            const threshold = this.threshold;

            if (this.councilMotionType === 'createExternalProposal') {
              args = [
                author,
                threshold,
                EdgewareFunctionPicker.getMethod(),
                EdgewareFunctionPicker.getMethod().encodedLength,
              ];

              createFunc = ([a, t, mt, l]) =>
                (app.chain as Substrate).council.createExternalProposal(
                  a,
                  t,
                  mt,
                  l
                );
            } else if (
              this.councilMotionType === 'createExternalProposalMajority'
            ) {
              args = [
                author,
                threshold,
                EdgewareFunctionPicker.getMethod(),
                EdgewareFunctionPicker.getMethod().encodedLength,
              ];

              createFunc = ([a, t, mt, l]) =>
                (app.chain as Substrate).council.createExternalProposalMajority(
                  a,
                  t,
                  mt,
                  l
                );
            } else if (
              this.councilMotionType === 'createExternalProposalDefault'
            ) {
              args = [
                author,
                threshold,
                EdgewareFunctionPicker.getMethod(),
                EdgewareFunctionPicker.getMethod().encodedLength,
              ];

              createFunc = ([a, t, mt, l]) =>
                (app.chain as Substrate).council.createExternalProposalDefault(
                  a,
                  t,
                  mt,
                  l
                );
            } else if (this.councilMotionType === 'createFastTrack') {
              args = [
                author,
                threshold,
                this.nextExternalProposalHash,
                this.votingPeriod,
                this.enactmentDelay,
              ];

              createFunc = ([a, b, c, d, e]) =>
                (app.chain as Substrate).council.createFastTrack(a, b, c, d, e);
            } else if (
              this.councilMotionType === 'createEmergencyCancellation'
            ) {
              args = [author, threshold, this.referendumId];

              createFunc = ([a, t, h]) =>
                (app.chain as Substrate).council.createEmergencyCancellation(
                  a,
                  t,
                  h
                );
            } else if (
              this.councilMotionType === 'createTreasuryApprovalMotion'
            ) {
              args = [author, threshold, this.treasuryProposalIndex];

              createFunc = ([a, t, i]) =>
                (app.chain as Substrate).council.createTreasuryApprovalMotion(
                  a,
                  t,
                  i
                );
            } else if (
              this.councilMotionType === 'createTreasuryRejectionMotion'
            ) {
              args = [author, threshold, this.treasuryProposalIndex];

              createFunc = ([a, t, i]) =>
                (app.chain as Substrate).council.createTreasuryRejectionMotion(
                  a,
                  t,
                  i
                );
            } else if (this.councilMotionType === 'vetoNextExternal') {
              args = [author, this.nextExternalProposalHash];

              createFunc = ([a, h]) =>
                (app.chain as Substrate).council.vetoNextExternal(a, h);
            } else {
              throw new Error('Invalid council motion type');
            }

            return createTXModal(createFunc(args));

            // Promise.resolve(createFunc(args)).then((modalData) =>
            //   createTXModal(modalData)
            // );
          }}
        />
      </>
    );
  }
}
