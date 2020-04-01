import { Observable, merge } from 'rxjs';
import { share, map, filter } from 'rxjs/operators';

import { StorageModule, AnyProposal, ChainBase, ChainClass } from 'models/models';
import { IStoreUpdate, UpdateType, ProposalStore } from 'models/stores';

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

  const map = new Map<string, StorageModule>([
    ['discussion', app.threads],
  ]);
  if (app.chain.base === ChainBase.Substrate) {
    map.set('referendum', (app.chain as Substrate).democracy);
    map.set('democracyproposal', (app.chain as Substrate).democracyProposals);
    map.set('councilmotion', (app.chain as Substrate).council);
    map.set('phragmenelection', (app.chain as Substrate).phragmenElections);
    map.set('treasuryproposal', (app.chain as Substrate).treasury);
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    map.set('cosmosproposal', (app.chain as Cosmos).governance);
  }
  if (app.chain.class === ChainClass.Kusama) {
    map.set('technicalcommitteemotion', (app.chain as Substrate).technicalCommittee);
  }
  if (app.chain.class === ChainClass.Edgeware) {
    map.set('signalingproposal', (app.chain as Edgeware).signaling);
  }
  if (app.chain.class === ChainClass.Moloch) {
    map.set('molochproposal', (app.chain as Moloch).governance);
  }
  return map;
};

/*
 * Slug helpers for routing
 */
export const proposalSlugToStore = (slug: string): ProposalStore<any> => {
  return proposalSlugToClass().get(slug).store;
};

export const proposalSlugsFromChain = (chain) => {
  const results = ['discussion'];
  if (chain.base === ChainBase.Substrate) {
    results.push('referendum');
    results.push('democracyproposal');
    results.push('democracypreimage');
    results.push('democracyimminent');
    results.push('councilmotion');
    results.push('treasuryproposal');
    results.push('phragmenelection');
  } else if (chain.base === ChainBase.CosmosSDK) {
    results.push('cosmosproposal');
  } else if (chain.class === ChainClass.Moloch) {
    results.push('molochproposal');
  }
  if (chain.class === ChainClass.Kusama) {
    results.push('technicalcommitteemotion');
  }
  if (chain.class === ChainClass.Edgeware) {
    results.push('signalingproposal');
  }
  return results;
};

export const proposalSlugToFriendlyName =
  new Map<string, string>([
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

/// This observable provides access to the stream of created Proposals
/// once they've been successfully added to their various stores.
/// This does NOT guarantee that their subscriptions have resolved yet,
/// but it does guarantee that the object is fully created.
/// The string returned is the proposal's slug, allowing a listener to tell apart proposal types.
/// TODO: maybe we should have this as a property of the proposal itself?
export const getProposalObservable = (): Observable<[AnyProposal, string]> => {
  const storeObservables = proposalSlugsFromChain(app.chain).map((s: string): Observable<[AnyProposal, string]> => {
    const store = proposalSlugToStore(s);
    return store.getObservable().pipe(
      filter((update: IStoreUpdate<any>) => update.updateType === UpdateType.Add),
      map((update: IStoreUpdate<any>) => [update.item, s]),
    );
  });
  return merge(...storeObservables).pipe(share());
};

export const uniqueIdToProposal = (uid) => {
  const [ slug, id ] = uid.split('_');
  return idToProposal(slug, id);
};

export const idToProposal = (slug, id) => {
  const store = proposalSlugToStore(slug);
  const proposal = store.getByIdentifier(id);
  if (!proposal) {
    throw new Error('invalid id: ' + id);
  } else {
    return proposal;
  }
};
