/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import app from 'state';
import { ProposalType, ChainNetwork } from 'common-common/src/types';
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

type NewProposalFormAttrs = {
  onChangeSlugEnum: (slug: any) => void;
  typeEnum: ProposalType;
};

// this should be titled the Substrate/Edgeware new proposal form
export class NewProposalForm extends ClassComponent<NewProposalFormAttrs> {
  view(vnode: m.Vnode<NewProposalFormAttrs>) {
    const { onChangeSlugEnum, typeEnum } = vnode.attrs;

    const author = app.user.activeAccount;

    if (!author) {
      return <CWText>Must be logged in</CWText>;
    }

    if (app.chain?.network === ChainNetwork.Plasm) {
      return <CWText>Unsupported network</CWText>;
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

    // substrate (also supported)
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

    return (
      <>
        {typeEnum === ProposalType.AaveProposal && (
          <AaveProposalForm author={author} />
        )}
        {typeEnum === ProposalType.CompoundProposal && (
          <CompoundProposalForm author={author} />
        )}
        {typeEnum === ProposalType.CosmosProposal && <CosmosProposalForm />}
        {typeEnum === ProposalType.PhragmenCandidacy && (
          <PhragmenCandidacyForm />
        )}
        {typeEnum === ProposalType.SputnikProposal && <SputnikProposalForm />}
        {typeEnum === ProposalType.SubstrateBountyProposal && (
          <SubstrateBountyProposalForm />
        )}
        {typeEnum === ProposalType.SubstrateCollectiveProposal && (
          <SubstrateCollectiveProposalForm author={author} />
        )}
        {typeEnum === ProposalType.SubstrateDemocracyProposal && (
          <SubstrateDemocracyProposalForm onChangeSlugEnum={onChangeSlugEnum} />
        )}
        {typeEnum === ProposalType.SubstrateTreasuryProposal && (
          <SubstrateTreasuryProposalForm author={author} />
        )}
        {typeEnum === ProposalType.SubstrateTreasuryTip && (
          <SubstrateTreasuryTipForm author={author} />
        )}
      </>
    );
  }
}
