import { ChainBase, ChainNetwork, ProposalType } from '@hicommonwealth/core';
import type { ProposalStore } from 'stores';
import { slugify } from 'utils';
import type ChainInfo from './models/ChainInfo';
import type NotificationSubscription from './models/NotificationSubscription';
import type ProposalModule from './models/ProposalModule';
import app from './state';

// returns a URL path to a proposal based on its type and id, taking into account
// custom domain prefixes as well.
export const getProposalUrlPath = (
  type: ProposalType,
  id: number | string,
  omitActiveId = true,
  chainId?: string,
): string => {
  let basePath: string;
  if (type === ProposalType.Thread) {
    basePath = `/discussion/${id}`;
  } else {
    basePath = `/proposal/${id}`;
  }
  if (omitActiveId || (app.isCustomDomain() && !chainId)) {
    return basePath;
  } else {
    return `/${chainId || app.activeChainId()}${basePath}`;
  }
};

export const getNotificationUrlPath = (
  subscription: NotificationSubscription,
): string => {
  const community = subscription.communityId;
  const type = subscription.Thread.slug;
  const id = `${subscription.Thread.identifier}-${slugify(
    subscription.Thread.title,
  )}`;

  return `/${community}/${type}/${id}`;
};

export const chainToProposalSlug = (c: ChainInfo): ProposalType => {
  if (c.base === ChainBase.CosmosSDK) return ProposalType.CosmosProposal;
  if (c.network === ChainNetwork.Sputnik) return ProposalType.SputnikProposal;
  if (c.network === ChainNetwork.Compound) return ProposalType.CompoundProposal;
  if (c.network === ChainNetwork.Aave) return ProposalType.AaveProposal;
  throw new Error(`Cannot determine proposal slug from chain ${c.id}.`);
};

export const proposalSlugToClass = () => {
  const mmap = new Map<string, ProposalModule<any, any, any>>([
    [ProposalType.Thread, null],
  ]);
  if (!app.chain) {
    return mmap;
  }
  if (app.chain.base === ChainBase.CosmosSDK) {
    mmap.set(ProposalType.CosmosProposal, (app.chain as any).governance);
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
  [ProposalType.Thread, 'Discussion Thread'],
  [ProposalType.CompoundProposal, 'Proposal'],
  [ProposalType.CosmosProposal, 'Proposal'],
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

export const chainEntityTypeToProposalSlug = (): ProposalType => {
  if (app.chain.network === ChainNetwork.Sputnik) {
    return ProposalType.SputnikProposal;
  }
  if (app.chain.network === ChainNetwork.Compound) {
    return ProposalType.CompoundProposal;
  }
  if (app.chain.network === ChainNetwork.Aave) {
    return ProposalType.AaveProposal;
  }
  if (app.chain.base === ChainBase.CosmosSDK) {
    return ProposalType.CosmosProposal;
  }
  return '' as ProposalType;
};

export const chainEntityTypeToProposalName = (): string => {
  if (app.chain.network === ChainNetwork.Sputnik) {
    return 'Sputnik Proposal';
  }
  if (app.chain.network === ChainNetwork.Compound) {
    return 'On-Chain Proposal';
  }
  if (app.chain.network === ChainNetwork.Aave) {
    return 'On-Chain Proposal';
  }
  if (app.chain.base === ChainBase.CosmosSDK) {
    return 'Proposal';
  }
  return '';
};
