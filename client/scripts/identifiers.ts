import { StorageModule, ChainBase, ChainClass, ProposalModule } from 'models';
import { ProposalStore } from 'stores';
import app from './state';
import ThreadsController from './controllers/server/threads';

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

  const mmap = new Map<string, ProposalModule<any, any, any> | ThreadsController>([
    ['discussion', app.threads],
  ]);
  if (app.chain.base === ChainBase.Substrate) {
    mmap.set('referendum', (app.chain as any).democracy);
    mmap.set('democracyproposal', (app.chain as any).democracyProposals);
    mmap.set('councilmotion', (app.chain as any).council);
    mmap.set('phragmenelection', (app.chain as any).phragmenElections);
    mmap.set('treasuryproposal', (app.chain as any).treasury);
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    mmap.set('cosmosproposal', (app.chain as any).governance);
  }
  if (app.chain.class === ChainClass.Kusama || app.chain.class === ChainClass.Polkadot) {
    mmap.set('technicalcommitteemotion', (app.chain as any).technicalCommittee);
  }
  if (app.chain.class === ChainClass.Edgeware) {
    mmap.set('signalingproposal', (app.chain as any).signaling);
  }
  if (app.chain.class === ChainClass.Moloch) {
    mmap.set('molochproposal', (app.chain as any).governance);
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
