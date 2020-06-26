import { StorageModule, ChainBase, ChainClass } from 'models';
import { ProposalStore } from 'stores';

import app from './state';
import Substrate from './controllers/chain/substrate/main';
import Edgeware from './controllers/chain/edgeware/main';
import Cosmos from './controllers/chain/cosmos/main';
import Moloch from './controllers/chain/ethereum/moloch/adapter';

export enum ProposalType {
  SubstrateDemocracyReferendum = 'referendum',
  SubstrateDemocracyProposal = 'democracyproposal',
  EdgewareSignalingProposal = 'signalingproposal',
  SubstrateCollectiveProposal = 'councilmotion',
  PhragmenCandidacy = 'phragmenelection',
  SubstrateTreasuryProposal = 'treasuryproposal',
  OffchainThread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  MolochProposal = 'molochproposal',
}

export const proposalSlugToClass = () => {
  if (app.community) {
    return new Map<string, StorageModule>([
      ['discussion', app.threads],
    ]);
  }

  const mmap = new Map<string, StorageModule>([
    ['discussion', app.threads],
  ]);
  if (app.chain.base === ChainBase.Substrate) {
    mmap.set('referendum', (app.chain as Substrate).democracy);
    mmap.set('democracyproposal', (app.chain as Substrate).democracyProposals);
    mmap.set('councilmotion', (app.chain as Substrate).council);
    mmap.set('phragmenelection', (app.chain as Substrate).phragmenElections);
    mmap.set('treasuryproposal', (app.chain as Substrate).treasury);
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    mmap.set('cosmosproposal', (app.chain as Cosmos).governance);
  }
  if (app.chain.class === ChainClass.Kusama || app.chain.class === ChainClass.Polkadot) {
    mmap.set('technicalcommitteemotion', (app.chain as Substrate).technicalCommittee);
  }
  if (app.chain.class === ChainClass.Edgeware) {
    mmap.set('signalingproposal', (app.chain as Edgeware).signaling);
  }
  if (app.chain.class === ChainClass.Moloch) {
    mmap.set('molochproposal', (app.chain as Moloch).governance);
  }
  return mmap;
};

/*
 * Slug helpers for routing
 */
export const proposalSlugToStore = (slug: string): ProposalStore<any> => {
  return proposalSlugToClass().get(slug).store;
};

export const proposalSlugToFriendlyName = new Map<string, string>([
  ['referendum', 'Democracy Referendum'],
  ['democracyproposal', 'Democracy Proposal'],
  ['democracypreimage', 'Democracy Preimage'],
  ['democracyimminent', 'Democracy Imminent Preimage'],
  ['signalingproposal', 'Signaling Proposal'],
  ['councilmotion', 'Council Motion'],
  ['phragmenelection', 'Phragmen Council Candidacy'],
  ['treasuryproposal', 'Treasury Proposal'],
  ['discussion', 'Discussion Thread'],
  ['cosmosproposal', 'Cosmos Proposal'],
  ['molochproposal', 'Moloch Proposal']
]);

export const idToProposal = (slug, id) => {
  const store = proposalSlugToStore(slug);
  const proposal = store.getByIdentifier(id);
  if (!proposal) {
    throw new Error(`invalid id: ${id}`);
  } else {
    return proposal;
  }
};

export const uniqueIdToProposal = (uid) => {
  const [ slug, id ] = uid.split('_');
  return idToProposal(slug, id);
};
