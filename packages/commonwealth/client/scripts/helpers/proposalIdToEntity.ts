import { ProposalType } from 'common-common/src/types';
import { SubstrateTypes, MolochTypes, CompoundTypes, AaveTypes } from 'chain-events/src';
import { IApp } from "state";

// this function takes an "old style" identifier such as treasuryproposal_4 and attempts
// fetch the corresponding chain entity from the database
export default function (app: IApp, chain: string, identifier: string) {
  console.log(`Looking up proposal: ${chain}: ${identifier}`);
  const [ prefix, type_id ] = identifier.split('_');
  const findEntity = (type) => {
    const entities = app.chain.chainEntities.store.getByType(type, true);
    for (const entity of entities) {
      if (entity.chain == chain && entity.typeId == type_id) {
        return entity;
      }
    }
    return null;
  };
  switch (prefix) {
    case ProposalType.SubstrateDemocracyReferendum: {
      return findEntity(SubstrateTypes.EntityKind.DemocracyReferendum.toString());
    }
    case ProposalType.SubstrateDemocracyProposal: {
      return findEntity(SubstrateTypes.EntityKind.DemocracyProposal.toString());
    }
    case ProposalType.SubstrateTechnicalCommitteeMotion:
    case ProposalType.SubstrateCollectiveProposal: {
      return findEntity(SubstrateTypes.EntityKind.CollectiveProposal.toString());
    }
    case ProposalType.SubstrateTreasuryProposal: {
      return findEntity(SubstrateTypes.EntityKind.TreasuryProposal.toString());
    }
    case ProposalType.SubstrateTreasuryTip: {
      return findEntity(SubstrateTypes.EntityKind.TipProposal.toString());
    }
    case ProposalType.MolochProposal: {
      return findEntity(MolochTypes.EntityKind.Proposal.toString());
    }
    case ProposalType.CompoundProposal: {
      return findEntity(CompoundTypes.EntityKind.Proposal.toString());
    }
    case ProposalType.AaveProposal: {
      return findEntity(AaveTypes.EntityKind.Proposal.toString());
    }
    // cosmos/near proposals do not have associated entities
    // ignore council elections -- no commenting on them
    default: {
      return null;
    }
  }
}
