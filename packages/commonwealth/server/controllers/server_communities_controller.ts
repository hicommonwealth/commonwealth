import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { TokenBalanceCache } from '../../../token-balance-cache/src';
import {
  SearchCommunitiesOptions,
  SearchCommunitiesResult,
  __searchCommunities,
} from './server_communities_methods/search_communities';
import {
  GetCommunitiesWithSnapshotsOptions,
  GetCommunitiesWithSnapshotsResult,
  __getCommunitiesWithSnapshots,
} from './server_communities_methods/get_communities_with_snapshots';
import {
  GetCommunityNodesOptions,
  GetCommunityNodesResult,
  __getCommunityNodes,
} from './server_communities_methods/get_community_nodes';

/**
 * Implements methods related to communities
 */
export class ServerCommunitiesController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache
  ) {}

  async searchCommunities(
    options: SearchCommunitiesOptions
  ): Promise<SearchCommunitiesResult> {
    return __searchCommunities.call(this, options);
  }

  async getCommunitiesWithSnapshots(
    options: GetCommunitiesWithSnapshotsOptions
  ): Promise<GetCommunitiesWithSnapshotsResult> {
    return __getCommunitiesWithSnapshots.call(this, options);
  }

  async getCommunityNodes(
    options: GetCommunityNodesOptions
  ): Promise<GetCommunityNodesResult> {
    return __getCommunityNodes.call(this, options);
  }
}
