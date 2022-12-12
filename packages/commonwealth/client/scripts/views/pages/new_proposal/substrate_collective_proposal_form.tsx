/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { Account } from 'models';
import Substrate from 'controllers/chain/substrate/adapter';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { SubstrateCollectiveProposal } from 'controllers/chain/substrate/collective_proposal';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import EdgewareFunctionPicker from '../../components/edgeware_function_picker';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ChainBase } from '../../../../../../common-common/src/types';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import ErrorPage from '../error';
import { CWButton } from '../../components/component_kit/cw_button';

type SubstrateCollectiveProposalFormAttrs = {
  author: Account;
};

export class SubstrateCollectiveProposalForm extends ClassComponent<SubstrateCollectiveProposalFormAttrs> {
  private councilMotionDescription;
  private councilMotionType;
  private enactmentDelay;
  private referendumId;
  private threshold;
  private treasuryProposalIndex;
  private votingPeriod;

  view(vnode: m.Vnode<SubstrateCollectiveProposalFormAttrs>) {
    const { author } = vnode.attrs;
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
            // createNewProposal(this, typeEnum, author, onChangeSlugEnum);
          }}
        />
      </>
    );
  }
}
