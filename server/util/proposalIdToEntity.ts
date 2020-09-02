import { SubstrateTypes, MolochTypes } from '@commonwealth/chain-events';

// this function takes an "old style" identifier such as treasuryproposal_4 and attempts
// fetch the corresponding chain entity from the database
export default async function (models, chain: string, identifier: string) {
  console.log(`Looking up proposal: ${chain}: ${identifier}`);
  const [ prefix, type_id ] = identifier.split('_');
  const findEntity = (type) => {
    return models.ChainEntity.findOne({ where: { chain, type, type_id } });
  };
  switch (prefix) {
    case 'referendum': {
      return findEntity(SubstrateTypes.EntityKind.DemocracyReferendum.toString());
    }
    case 'democracyproposal': {
      return findEntity(SubstrateTypes.EntityKind.DemocracyProposal.toString());
    }
    case 'signalingproposal': {
      return findEntity(SubstrateTypes.EntityKind.SignalingProposal.toString());
    }
    case 'technicalcommitteemotion':
    case 'councilmotion': {
      return findEntity(SubstrateTypes.EntityKind.CollectiveProposal.toString());
    }
    case 'treasuryproposal': {
      return findEntity(SubstrateTypes.EntityKind.TreasuryProposal.toString());
    }
    case 'molochproposal': {
      return findEntity(MolochTypes.EntityKind.Proposal.toString());
    }
    // TODO: cosmosproposal
    // ignore council elections -- no commenting on them
    default: {
      return null;
    }
  }
}
