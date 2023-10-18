import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { TokenBalanceCache } from '../../../token-balance-cache/src';
import {
  __getRelatedCommunities,
  GetRelatedCommunitiesOptions,
  GetRelatedCommunitiesResult
} from './server_chains_methods/get_related_communities';
import {
  SearchChainsOptions,
  SearchChainsResult,
  __searchChains,
} from './server_chains_methods/search_chains';
import {
  GetChainsWithSnapshotsOptions,
  GetChainsWithSnapshotsResult,
  __getChainsWithSnapshots,
} from './server_chains_methods/get_chains_with_snapshots';
import {
  GetChainNodesOptions,
  GetChainNodesResult,
  __getChainNodes,
} from './server_chains_methods/get_chain_nodes';

/**
 * Implements methods related to chains
 */
export class ServerChainsController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache
  ) {}

  async searchChains(
    options: SearchChainsOptions
  ): Promise<SearchChainsResult> {
    return __searchChains.call(this, options);
  }

  async getChainsWithSnapshots(
    options: GetChainsWithSnapshotsOptions
  ): Promise<GetChainsWithSnapshotsResult> {
    return __getChainsWithSnapshots.call(this, options);
  }

  async getChainNodes(
    options: GetChainNodesOptions
  ): Promise<GetChainNodesResult> {
    return __getChainNodes.call(this, options);
  }

  async getRelatedCommunities(
    options: GetRelatedCommunitiesOptions
  ): Promise<GetRelatedCommunitiesResult> {
    return __getRelatedCommunities.call(this, options);
  }
}
