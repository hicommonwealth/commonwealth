import { StorageModule, ProposalModule, ChainInfo } from 'models';
import { SubstrateTypes, IChainEntityKind } from 'chain-events/src';
import { ProposalStore } from 'stores';
import { ProposalType, ChainBase, ChainNetwork } from 'common-common/src/types';
import { requiresTypeSlug } from 'utils';
import app from './state';
import ThreadsController from './controllers/server/threads';

export const pathIsDiscussion = (scope: string | null, path: string): boolean => {
  return path.startsWith(`/${scope}/discussion`) || path.startsWith('/discussion');
}

// returns a URL path to a proposal based on its type and id, taking into account
// custom domain prefixes as well.
export const getProposalUrlPath = (type: ProposalType, id: string, omitActiveId = false, chainId?: string): string => {
  let basePath: string;
  const useTypeSlug = requiresTypeSlug(type);
  if (type === ProposalType.Thread) {
    basePath = `/discussion/${id}`;
  } else if (useTypeSlug) {
    basePath = `/proposal/${type}/${id}`;
  } else {
    basePath = `/proposal/${id}`;
  }
  if (omitActiveId || (app.isCustomDomain() && !chainId)) {
    return basePath;
  } else {
    return `/${chainId || app.activeChainId()}${basePath}`;
  }
}

export const chainToProposalSlug = (c: ChainInfo): ProposalType => {
  if (c.base === ChainBase.CosmosSDK) return ProposalType.CosmosProposal;
  if (c.network === ChainNetwork.Sputnik) return ProposalType.SputnikProposal;
  if (c.network === ChainNetwork.Moloch) return ProposalType.MolochProposal;
  if (c.network === ChainNetwork.Compound) return ProposalType.CompoundProposal;
  if (c.network === ChainNetwork.Aave) return ProposalType.AaveProposal;
  throw new Error(`Cannot determine proposal slug from chain ${c.id}.`);
}

export const proposalSlugToClass = () => {
  const mmap = new Map<
    string,
    ProposalModule<any, any, any> | ThreadsController
  >([[ProposalType.Thread, app.threads]]);
  if (app.chain.base === ChainBase.Substrate) {
    mmap.set(
      ProposalType.SubstrateDemocracyReferendum,
      (app.chain as any).democracy
    );
    mmap.set(
      ProposalType.SubstrateDemocracyProposal,
      (app.chain as any).democracyProposals
    );
    mmap.set(
      ProposalType.SubstrateCollectiveProposal,
      (app.chain as any).council
    );
    mmap.set(
      ProposalType.PhragmenCandidacy,
      (app.chain as any).phragmenElections
    );
    mmap.set(
      ProposalType.SubstrateTreasuryProposal,
      (app.chain as any).treasury
    );
    mmap.set(ProposalType.SubstrateBountyProposal, (app.chain as any).bounties);
    mmap.set(ProposalType.SubstrateTreasuryTip, (app.chain as any).tips);
  } else if (app.chain.base === ChainBase.CosmosSDK) {
    mmap.set(ProposalType.CosmosProposal, (app.chain as any).governance);
  }
  if (
    app.chain.network === ChainNetwork.Kusama ||
    app.chain.network === ChainNetwork.Polkadot
  ) {
    mmap.set(
      ProposalType.SubstrateTechnicalCommitteeMotion,
      (app.chain as any).technicalCommittee
    );
  }
  if (app.chain.network === ChainNetwork.Moloch) {
    mmap.set(ProposalType.MolochProposal, (app.chain as any).governance);
  }
  if (app.chain.network === ChainNetwork.Compound) {
    mmap.set(ProposalType.CompoundProposal, (app.chain as any).governance);
  }
  if (app.chain.network === ChainNetwork.Aave) {
    mmap.set(ProposalType.AaveProposal, (app.chain as any).governance);
  }
  if (app.chain.network === ChainNetwork.Sputnik) {
    mmap.set(ProposalType.SputnikProposal, (app.chain as any).dao);
  }
  return mmap;
};

/*
 * Slug helpers for routing
 */
export const proposalSlugToStore = (slug: string): ProposalStore<any> => {
  return proposalSlugToClass().get(slug).store;
};

export const proposalSlugToFriendlyName = new Map<ProposalType, string>([
  [ProposalType.SubstrateDemocracyReferendum, 'Democracy Referendum'],
  [ProposalType.SubstrateDemocracyProposal, 'Democracy Proposal'],
  [ProposalType.SubstratePreimage, 'Democracy Preimage'],
  [ProposalType.SubstrateBountyProposal, 'Bounty Proposal'],
  [ProposalType.SubstrateImminentPreimage, 'Democracy Imminent Preimage'],
  [ProposalType.SubstrateCollectiveProposal, 'Council Motion'],
  [ProposalType.PhragmenCandidacy, 'Phragmen Council Candidacy'],
  [ProposalType.SubstrateTreasuryProposal, 'Treasury Proposal'],
  [ProposalType.SubstrateTreasuryTip, 'Treasury Tip'],
  [ProposalType.Thread, 'Discussion Thread'],
  [ProposalType.CompoundProposal, 'Proposal'],
  [ProposalType.CosmosProposal, 'Proposal'],
  [ProposalType.MolochProposal, 'Proposal'],
  [ProposalType.AaveProposal, 'Proposal'],
  [ProposalType.SputnikProposal, 'Proposal'],
]);

export const idToProposal = (slug: string, id: string | number) => {
  const store = proposalSlugToStore(slug);
  const proposal = store.getByIdentifier(id);
  if (!proposal) {
    throw new Error(`Proposal missing from store with id ${id}`);
  } else {
    return proposal;
  }
};

export const uniqueIdToProposal = (uid: string) => {
  const [slug, id] = uid.split('_');
  return idToProposal(slug, id);
};

export const chainEntityTypeToProposalSlug = (
  t: IChainEntityKind
): ProposalType => {
  if (t === SubstrateTypes.EntityKind.TreasuryProposal)
    return ProposalType.SubstrateTreasuryProposal;
  else if (t === SubstrateTypes.EntityKind.DemocracyReferendum)
    return ProposalType.SubstrateDemocracyReferendum;
  else if (t === SubstrateTypes.EntityKind.DemocracyProposal)
    return ProposalType.SubstrateDemocracyProposal;
  else if (t === SubstrateTypes.EntityKind.CollectiveProposal)
    return ProposalType.SubstrateCollectiveProposal;
  else if (t === SubstrateTypes.EntityKind.TreasuryBounty)
    return ProposalType.SubstrateBountyProposal;
  else if (t === SubstrateTypes.EntityKind.TipProposal)
    return ProposalType.SubstrateTreasuryTip;
  else if (t === 'proposal') {
    if (app.chain.network === ChainNetwork.Sputnik) {
      return ProposalType.SputnikProposal;
    }
    if (app.chain.network === ChainNetwork.Moloch) {
      return ProposalType.MolochProposal;
    }
    if (app.chain.network === ChainNetwork.Compound) {
      return ProposalType.CompoundProposal;
    }
    if (app.chain.network === ChainNetwork.Aave) {
      return ProposalType.AaveProposal;
    }
  }
};

export const proposalSlugToChainEntityType = (
  t: ProposalType
): IChainEntityKind => {
  if (t === ProposalType.SubstrateTreasuryProposal)
    return SubstrateTypes.EntityKind.TreasuryProposal;
  else if (t === ProposalType.SubstrateDemocracyReferendum)
    return SubstrateTypes.EntityKind.DemocracyReferendum;
  else if (t === ProposalType.SubstrateDemocracyProposal)
    return SubstrateTypes.EntityKind.DemocracyProposal;
  else if (t === ProposalType.SubstrateCollectiveProposal)
    return SubstrateTypes.EntityKind.CollectiveProposal;
  else if (t === ProposalType.SubstrateBountyProposal)
    return SubstrateTypes.EntityKind.TreasuryBounty;
  else if (t === ProposalType.SubstrateTreasuryTip)
    return SubstrateTypes.EntityKind.TipProposal;
};

export const chainEntityTypeToProposalName = (t: IChainEntityKind): string => {
  if (t === SubstrateTypes.EntityKind.TreasuryProposal)
    return 'Treasury Proposal';
  else if (t === SubstrateTypes.EntityKind.DemocracyReferendum)
    return 'Referendum';
  else if (t === SubstrateTypes.EntityKind.DemocracyProposal)
    return 'Democracy Proposal';
  else if (t === SubstrateTypes.EntityKind.CollectiveProposal)
    return 'Council Motion';
  else if (t === SubstrateTypes.EntityKind.TreasuryBounty)
    return 'Bounty Proposal';
  else if (t === SubstrateTypes.EntityKind.TipProposal) return 'Treasury Tip';
  else if (t === 'proposal') {
    if (app.chain.network === ChainNetwork.Sputnik) {
      return 'Sputnik Proposal';
    }
    if (app.chain.network === ChainNetwork.Moloch) {
      return 'Moloch Proposal';
    }
    if (app.chain.network === ChainNetwork.Compound) {
      return 'Onchain Proposal';
    }
    if (app.chain.network === ChainNetwork.Aave) {
      return 'Onchain Proposal';
    }
  }
};

export const chainEntityTypeToProposalShortName = (
  t: IChainEntityKind
): string => {
  if (t === SubstrateTypes.EntityKind.TreasuryProposal) return 'Tres';
  else if (t === SubstrateTypes.EntityKind.DemocracyReferendum) return 'Ref';
  else if (t === SubstrateTypes.EntityKind.DemocracyProposal) return 'Prop';
  else if (t === SubstrateTypes.EntityKind.CollectiveProposal) return 'Mot';
  else if (t === SubstrateTypes.EntityKind.TipProposal) return 'Tip';
  else if (t === SubstrateTypes.EntityKind.TreasuryBounty) return 'Bounty';
};
