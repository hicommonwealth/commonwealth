/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/new_proposal/index.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import Sublayout from 'views/sublayout';
import { PageLoading } from 'views/pages/loading';
import { ChainNetwork, ProposalType } from 'common-common/src/types';
import {
  proposalSlugToClass,
  proposalSlugToFriendlyName,
  chainToProposalSlug,
} from 'identifiers';
import { ProposalModule } from 'models';
import { PageNotFound } from '../404';
import { CWText } from '../../components/component_kit/cw_text';
import { AaveProposalForm } from './aave_proposal_form';
import { CompoundProposalForm } from './compound_proposal_form';
import { CosmosProposalForm } from './cosmos_proposal_form';
import { PhragmenCandidacyForm } from './phragmen_candidacy_form';
import { SputnikProposalForm } from './sputnik_proposal_form';
import { SubstrateBountyProposalForm } from './substrate_bounty_proposal_form';
import { SubstrateCollectiveProposalForm } from './substrate_collective_proposal_form';
import { SubstrateDemocracyProposalForm } from './substrate_democracy_proposal_form';
import { SubstrateTreasuryProposalForm } from './substrate_treasury_proposal_form';
import { SubstrateTreasuryTipForm } from './substrate_treasury_tip_form';

type NewProposalPageAttrs = {
  type: string;
};

class NewProposalPage extends ClassComponent<NewProposalPageAttrs> {
  private titlePre: string;
  private typeEnum;

  view(vnode: m.Vnode<NewProposalPageAttrs>) {
    this.typeEnum = vnode.attrs.type;
    this.titlePre = 'New';

    // auto-redirect to the new thread page if sent here accidentally
    if (this.typeEnum === ProposalType.Thread) {
      navigateToSubpage('/new/discussion');
    }

    // wait for chain
    if (app.chain?.failed)
      return (
        <PageNotFound
          title="Wrong Ethereum Provider Network!"
          message="Change Metamask to point to Ethereum Mainnet"
        />
      );

    if (!app.chain || !app.chain.loaded || !app.chain.meta) {
      return <PageLoading />;
    }

    // infer proposal type if possible
    if (!this.typeEnum) {
      try {
        this.typeEnum = chainToProposalSlug(app.chain.meta);
      } catch (e) {
        return (
          <PageNotFound
            title="Invalid Page"
            message="Cannot determine proposal type."
          />
        );
      }
    }

    // check if module is still initializing
    const c = proposalSlugToClass().get(this.typeEnum) as ProposalModule<
      any,
      any,
      any
    >;

    if (!c.ready) {
      app.chain.loadModules([c]);
      return <PageLoading />;
    }

    // check typeEnum against supported types (use Omit on ProposalType?)

    // unsupported
    // MolochProposal = 'molochproposal',
    // SubstrateDemocracyReferendum = 'referendum',
    // SubstrateImminentPreimage = 'democracyimminent',
    // SubstratePreimage = 'democracypreimage',
    // SubstrateTechnicalCommitteeMotion = 'technicalcommitteemotion',
    // Thread = 'discussion',

    // supported
    // AaveProposal = 'onchainproposal',
    // CompoundProposal = 'compoundproposal',
    // CosmosProposal = 'cosmosproposal',
    // PhragmenCandidacy = 'phragmenelection',
    // SputnikProposal = 'sputnikproposal',
    // SubstrateBountyProposal = 'bountyproposal',
    // SubstrateCollectiveProposal = 'councilmotion',
    // SubstrateDemocracyProposal = 'democracyproposal',
    // SubstrateTreasuryProposal = 'treasuryproposal',
    // SubstrateTreasuryTip = 'treasurytip',

    // else {
    //   return <div class="NewProposalForm">Invalid proposal type</div>;
    // }

    if (!app.user.activeAccount) {
      return <CWText>Must be logged in</CWText>;
    }

    if (app.chain?.network === ChainNetwork.Plasm) {
      return <CWText>Unsupported network</CWText>;
    }

    return (
      <Sublayout>
        <div class="NewProposalPage">
          <CWText type="h3" fontWeight="medium">
            {this.titlePre} {proposalSlugToFriendlyName.get(this.typeEnum)}
          </CWText>
          {this.typeEnum === ProposalType.AaveProposal && <AaveProposalForm />}
          {this.typeEnum === ProposalType.CompoundProposal && (
            <CompoundProposalForm />
          )}
          {this.typeEnum === ProposalType.CosmosProposal && (
            <CosmosProposalForm />
          )}
          {this.typeEnum === ProposalType.PhragmenCandidacy && (
            <PhragmenCandidacyForm />
          )}
          {this.typeEnum === ProposalType.SputnikProposal && (
            <SputnikProposalForm />
          )}
          {this.typeEnum === ProposalType.SubstrateBountyProposal && (
            <SubstrateBountyProposalForm />
          )}
          {this.typeEnum === ProposalType.SubstrateCollectiveProposal && (
            <SubstrateCollectiveProposalForm />
          )}
          {this.typeEnum === ProposalType.SubstrateDemocracyProposal && (
            <SubstrateDemocracyProposalForm
              onChangeSlugEnum={(value) => {
                this.titlePre = value !== 'proposal' ? 'Note' : 'New';
                this.typeEnum = `democracy${value}`;
                m.redraw();
              }}
            />
          )}
          {this.typeEnum === ProposalType.SubstrateTreasuryProposal && (
            <SubstrateTreasuryProposalForm />
          )}
          {this.typeEnum === ProposalType.SubstrateTreasuryTip && (
            <SubstrateTreasuryTipForm />
          )}
        </div>
      </Sublayout>
    );
  }
}

export default NewProposalPage;
