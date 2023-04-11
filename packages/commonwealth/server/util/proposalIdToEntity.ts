import {
  AaveTypes,
  CompoundTypes,
  SubstrateTypes,
} from 'chain-events/src/types';
import { ProposalType } from 'common-common/src/types';

// this function takes an "old style" identifier such as treasuryproposal_4 and attempts
// fetch the corresponding chain entity from the database
export default async function (models, chain: string, identifier: string) {
  console.log(`Looking up proposal: ${chain}: ${identifier}`);
  const [prefix, type_id] = identifier.split('_');
  const findEntity = (type) => {
    return models.ChainEntity.findOne({ where: { chain, type, type_id } });
  };
  switch (prefix) {
    case ProposalType.SubstrateDemocracyReferendum: {
      return findEntity(
        SubstrateTypes.EntityKind.DemocracyReferendum.toString()
      );
    }
    case ProposalType.SubstrateDemocracyProposal: {
      return findEntity(SubstrateTypes.EntityKind.DemocracyProposal.toString());
    }
    case ProposalType.SubstrateTechnicalCommitteeMotion:
    case ProposalType.SubstrateTreasuryProposal: {
      return findEntity(SubstrateTypes.EntityKind.TreasuryProposal.toString());
    }
    case ProposalType.SubstrateTreasuryTip: {
      return findEntity(SubstrateTypes.EntityKind.TipProposal.toString());
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
