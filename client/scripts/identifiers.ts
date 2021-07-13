import { StorageModule, ChainBase, ProposalModule, ChainNetwork } from 'models';
import { ProposalStore } from 'stores';
import app from './state';
import ThreadsController from './controllers/server/threads';

export enum ProposalType {
  SubstrateDemocracyReferendum = 'referendum',
  SubstrateDemocracyProposal = 'democracyproposal',
  SubstrateBountyProposal = 'bountyproposal',
  SubstrateTreasuryTip = 'treasurytip',
  SubstrateCollectiveProposal = 'councilmotion',
  PhragmenCandidacy = 'phragmenelection',
  SubstrateTreasuryProposal = 'treasuryproposal',
  OffchainThread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  MolochProposal = 'molochproposal',
  MarlinProposal = 'marlinproposal',
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
    mmap.set('bountyproposal', (app.chain as any).bounties);
    mmap.set('treasurytip', (app.chain as any).tips);
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    mmap.set('cosmosproposal', (app.chain as any).governance);
  }
  if (app.chain.network === ChainNetwork.Kusama || app.chain.network === ChainNetwork.Polkadot) {
    mmap.set('technicalcommitteemotion', (app.chain as any).technicalCommittee);
  }
  if (app.chain.network === ChainNetwork.Moloch) {
    mmap.set('molochproposal', (app.chain as any).governance);
  }
  if (app.chain.network === ChainNetwork.Marlin) {
    mmap.set('marlinproposal', (app.chain as any).governance);
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
  ['bountyproposal', 'Bounty Proposal'],
  ['democracyimminent', 'Democracy Imminent Preimage'],
  ['councilmotion', 'Council Motion'],
  ['phragmenelection', 'Phragmen Council Candidacy'],
  ['treasuryproposal', 'Treasury Proposal'],
  ['treasurytip', 'Treasury Tip'],
  ['discussion', 'Discussion Thread'],
  ['marlinproposal', 'Proposal'],
  ['cosmosproposal', 'Proposal'],
  ['molochproposal', 'Proposal']
]);

export const idToProposal = (slug, id) => {
  const store = proposalSlugToStore(slug);
  const proposal = store.getByIdentifier(id);
  if (!proposal) {
    throw new Error(`Proposal missing from store with id ${id}`);
  } else {
    return proposal;
  }
};

export const uniqueIdToProposal = (uid) => {
  const [ slug, id ] = uid.split('_');
  return idToProposal(slug, id);
};

export const chainEntityTypeToProposalSlug = (t: string) => {
  if (t === 'treasury-proposal') return ProposalType.SubstrateTreasuryProposal;
  else if (t === 'democracy-referendum') return ProposalType.SubstrateDemocracyReferendum;
  else if (t === 'democracy-proposal') return ProposalType.SubstrateDemocracyProposal;
  else if (t === 'collective-proposal') return ProposalType.SubstrateCollectiveProposal;
  else if (t === 'treasury-bounty') return ProposalType.SubstrateBountyProposal;
  else if (t === 'tip-proposal') return ProposalType.SubstrateTreasuryTip;
};

export const proposalSlugToChainEntityType = (t) => {
  if (t === ProposalType.SubstrateTreasuryProposal) return 'treasury-proposal';
  else if (t === ProposalType.SubstrateDemocracyReferendum) return 'democracy-referendum';
  else if (t === ProposalType.SubstrateDemocracyProposal) return 'democracy-proposal';
  else if (t === ProposalType.SubstrateCollectiveProposal) return 'collective-proposal';
  else if (t === ProposalType.SubstrateBountyProposal) return 'treasury-bounty';
  else if (t === ProposalType.SubstrateTreasuryTip) return 'tip-proposal';
};

export const chainEntityTypeToProposalName = (t: string) => {
  if (t === 'treasury-proposal') return 'Treasury Proposal';
  else if (t === 'democracy-referendum') return 'Referendum';
  else if (t === 'democracy-proposal') return 'Democracy Proposal';
  else if (t === 'collective-proposal') return 'Council Motion';
  else if (t === 'treasury-bounty') return 'Bounty Proposal';
  else if (t === 'tip-proposal') return 'Treasury Tip';
};

export const chainEntityTypeToProposalShortName = (t: string) => {
  if (t === 'treasury-proposal') return 'Tres';
  else if (t === 'democracy-referendum') return 'Ref';
  else if (t === 'democracy-proposal') return 'Prop';
  else if (t === 'collective-proposal') return 'Mot';
  else if (t === 'tip-proposal') return 'Tip';
  else if (t === 'treasury-bounty') return 'Bounty';
};
