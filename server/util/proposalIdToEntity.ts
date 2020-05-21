import { SubstrateEntityKind } from '../../shared/events/edgeware/types';

// given an "old style" identifier such as treasuryproposal_4, attempts to
// fetch the corresponding chain entity from the database
export default async function (models, chain: string, identifier: string) {
  console.log(`Looking up proposal: ${chain}: ${identifier}`);
  const [ prefix, type_id ] = identifier.split('_');
  const findEntity = (type) => {
    return models.ChainEntity.findOne({ where: { chain, type, type_id } });
  };
  switch (prefix) {
    case 'referendum': {
      return findEntity(SubstrateEntityKind.DemocracyReferendum.toString());
    }
    case 'democracyproposal': {
      return findEntity(SubstrateEntityKind.DemocracyProposal.toString());
    }
    case 'signalingproposal': {
      return findEntity(SubstrateEntityKind.SignalingProposal.toString());
    }
    case 'technicalcommitteemotion':
    case 'councilmotion': {
      return findEntity(SubstrateEntityKind.CollectiveProposal.toString());
    }
    case 'treasuryproposal': {
      return findEntity(SubstrateEntityKind.TreasuryProposal.toString());
    }
    // TODO: cosmosproposal, molochproposal
    // ignore council elections -- no commenting on them
    default: {
      return null;
    }
  }
}
