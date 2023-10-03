import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { TokenBalanceCache } from '../../../token-balance-cache/src';
import {
  SearchCommunitiesOptions,
  SearchCommunitiesResult,
  __searchCommunities,
} from './server_communities_methods/search_communities';
import {
  GetCommunitiesOptions,
  GetCommunitiesResult,
  __getCommunities,
} from './server_communities_methods/get_communities';
import {
  GetCommunityNodesOptions,
  GetCommunityNodesResult,
  __getCommunityNodes,
} from './server_communities_methods/get_community_nodes';
import {
  CreateCommunityOptions,
  CreateCommunityResult,
  __createCommunity,
} from './server_communities_methods/create_community';
import {
  DeleteCommunityOptions,
  DeleteCommunityResult,
  __deleteCommunity,
} from './server_communities_methods/delete_community';
import {
  UpdateCommunityOptions,
  UpdateCommunityResult,
  __updateCommunity,
} from './server_communities_methods/update_community';
import {
  GetCommunityStatsOptions,
  GetCommunityStatsResult,
  __getCommunityStats,
} from './server_communities_methods/get_community_stats';
import {
  CreateCommunityNodeOptions,
  CreateCommunityNodeResult,
  __createCommunityNode,
} from './server_communities_methods/create_community_node';

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

  async getCommunities(
    options: GetCommunitiesOptions
  ): Promise<GetCommunitiesResult> {
    return __getCommunities.call(this, options);
  }

  async getCommunityNodes(
    options: GetCommunityNodesOptions
  ): Promise<GetCommunityNodesResult> {
    return __getCommunityNodes.call(this, options);
  }

  async createCommunityNode(
    options: CreateCommunityNodeOptions
  ): Promise<CreateCommunityNodeResult> {
    return __createCommunityNode.call(this, options);
  }

  async createCommunity(
    options: CreateCommunityOptions
  ): Promise<CreateCommunityResult> {
    return __createCommunity.call(this, options);
  }

  async updateCommunity(
    options: UpdateCommunityOptions
  ): Promise<UpdateCommunityResult> {
    return __updateCommunity.call(this, options);
  }

  async deleteCommunity(
    options: DeleteCommunityOptions
  ): Promise<DeleteCommunityResult> {
    return __deleteCommunity.call(this, options);
  }

  async getCommunityStats(
    options: GetCommunityStatsOptions
  ): Promise<GetCommunityStatsResult> {
    return __getCommunityStats.call(this, options);
  }
}
