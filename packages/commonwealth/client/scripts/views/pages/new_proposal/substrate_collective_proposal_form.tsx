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
import { ProposalType } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';
import { createTXModal } from '../../modals/tx_signing_modal';

export class SubstrateCollectiveProposalForm extends ClassComponent {
  private councilMotionDescription: string;
  private councilMotionType: string;
  private enactmentDelay: number;
  private nextExternalProposalHash: string;
  private referendumId: string;
  private threshold: number;
  private treasuryProposalIndex: string;
  private votingPeriod: number;

  view() {
    const author = app.user.activeAccount as SubstrateAccount;
    const substrate = app.chain as Substrate;
    const motions = SubstrateCollectiveProposal.motions;

    if (!this.councilMotionType) {
      this.councilMotionType = motions[0].name;
      this.councilMotionDescription = motions[0].description;
    }

    const hasExternalProposalSelector =
      this.councilMotionType === 'vetoNextExternal' ||
      this.councilMotionType === 'createFastTrack' ||
      this.councilMotionType === 'createExternalProposalDefault';

    let dataLoaded;

    if (!author.isCouncillor) {
      dataLoaded = false;
    } else if (hasExternalProposalSelector) {
      dataLoaded = !!substrate.democracyProposals?.initialized;
    }

    if (!dataLoaded) {
      if (substrate.chain?.timedOut) {
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
            label: m_.label,
            value: m_.name,
          }))}
          onSelect={(result) => {
            this.councilMotionType = result.value;
            this.councilMotionDescription = motions.find(
              (m_) => m_.name === result.value
            ).description;
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
        {hasExternalProposalSelector &&
          substrate.democracyProposals.nextExternal && (
            <CWDropdown
              label="Proposal"
              options={[
                {
                  value:
                    substrate.democracyProposals.nextExternal[0].hash.toString(),
                  label: `${substrate.democracyProposals.nextExternal[0].hash
                    .toString()
                    .slice(0, 8)}...`,
                },
              ]}
              onSelect={(result) => {
                this.nextExternalProposalHash = result.value;
              }}
            />
          )}
        {this.councilMotionType === 'createFastTrack' ||
          (this.councilMotionType === 'createExternalProposalDefault' && (
            <>
              <CWTextInput
                label="Voting Period"
                placeholder="Blocks (minimum enforced)"
                oninput={(e) => {
                  this.votingPeriod = +e.target.value;
                }}
              />
              <CWTextInput
                label="Enactment Delay"
                placeholder="Blocks (minimum enforced)"
                oninput={(e) => {
                  this.enactmentDelay = +e.target.value;
                }}
              />
            </>
          ))}

        {this.councilMotionType === 'createEmergencyCancellation' && (
          <CWDropdown
            label="Referendum"
            options={substrate.democracy.store.getAll().map((r) => ({
              value: r.identifier,
              label: `${r.shortIdentifier}: ${r.title}`,
            }))}
            onSelect={(result) => {
              this.referendumId = result.value;
            }}
          />
        )}
        {this.councilMotionType === 'createTreasuryApprovalMotion' ||
          (this.councilMotionType === 'createTreasuryRejectionMotion' && (
            <CWDropdown
              label="Treasury Proposal"
              options={substrate.treasury.store.getAll().map((r) => ({
                value: r.identifier,
                label: r.shortIdentifier,
              }))}
              onSelect={(result) => {
                this.treasuryProposalIndex = result.value;
              }}
            />
          ))}

        {this.councilMotionType !== 'vetoNextExternal' && (
          <CWTextInput
            label="Threshold"
            placeholder="How many members must vote yes to execute?"
            oninput={(e) => {
              this.threshold = +e.target.value;
            }}
          />
        )}
        <CWButton
          disabled={!author.isCouncillor}
          label="Send transaction"
          onclick={(e) => {
            e.preventDefault();

            if (!this.threshold) {
              throw new Error('Invalid threshold');
            }

            let createFunc: (...args) => ITXModalData | Promise<ITXModalData> =
              (a) => {
                return (
                  proposalSlugToClass().get(
                    ProposalType.SubstrateCollectiveProposal
                  ) as ProposalModule<any, any, any>
                ).createTx(...a);
              };

            let args = [];

            const threshold = this.threshold;

            if (this.councilMotionType === 'createExternalProposal') {
              args = [
                author,
                threshold,
                EdgewareFunctionPicker.getMethod(),
                EdgewareFunctionPicker.getMethod().encodedLength,
              ];

              createFunc = ([a, t, mt, l]) =>
                substrate.council.createExternalProposal(a, t, mt, l);
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
                substrate.council.createExternalProposalMajority(a, t, mt, l);
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
                substrate.council.createExternalProposalDefault(a, t, mt, l);
            } else if (this.councilMotionType === 'createFastTrack') {
              args = [
                author,
                threshold,
                this.nextExternalProposalHash,
                this.votingPeriod,
                this.enactmentDelay,
              ];

              createFunc = ([a, b, c, d, _e]) =>
                substrate.council.createFastTrack(a, b, c, d, _e);
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
                substrate.council.createTreasuryApprovalMotion(a, t, i);
            } else if (
              this.councilMotionType === 'createTreasuryRejectionMotion'
            ) {
              args = [author, threshold, this.treasuryProposalIndex];

              createFunc = ([a, t, i]) =>
                substrate.council.createTreasuryRejectionMotion(a, t, i);
            } else if (this.councilMotionType === 'vetoNextExternal') {
              args = [author, this.nextExternalProposalHash];

              createFunc = ([a, h]) => substrate.council.vetoNextExternal(a, h);
            } else {
              throw new Error('Invalid council motion type');
            }

            return createTXModal(createFunc(args));
          }}
        />
      </>
    );
  }
}
