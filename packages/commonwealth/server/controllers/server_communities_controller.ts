import { DB } from '@hicommonwealth/model';
import BanCache from '../util/banCheckCache';
import { TokenBalanceCache } from '../util/tokenBalanceCache/tokenBalanceCache';
import {
  __createChainNode,
  CreateChainNodeOptions,
  CreateChainNodeResult,
} from './server_communities_methods/create_chain_node';
import {
  __createCommunity,
  CreateCommunityOptions,
  CreateCommunityResult,
} from './server_communities_methods/create_community';
import {
  __deleteCommunity,
  DeleteCommunityOptions,
  DeleteCommunityResult,
} from './server_communities_methods/delete_community';
import {
  __getChainNodes,
  GetChainNodesOptions,
  GetChainNodesResult,
} from './server_communities_methods/get_chain_nodes';
import {
  __getCommunities,
  GetCommunitiesOptions,
  GetCommunitiesResult,
} from './server_communities_methods/get_communities';
import { __getCommunityStake } from './server_communities_methods/get_community_stake';
import {
  __getRelatedCommunities,
  GetRelatedCommunitiesQuery,
  GetRelatedCommunitiesResult,
} from './server_communities_methods/get_related_communities';
import {
  __putCommunityStake,
  PutCommunityStakeOptions,
  PutCommunityStakeResult,
} from './server_communities_methods/put_community_stake';
import {
  __searchCommunities,
  SearchCommunitiesOptions,
  SearchCommunitiesResult,
} from './server_communities_methods/search_communities';
import {
  __updateCommunity,
  UpdateCommunityOptions,
  UpdateCommunityResult,
} from './server_communities_methods/update_community';

/**
 * Implements methods related to communities
 */
export class ServerCommunitiesController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache,
  ) {}

  async searchCommunities(
    options: SearchCommunitiesOptions,
  ): Promise<SearchCommunitiesResult> {
    return __searchCommunities.call(this, options);
  }

  async getCommunities(
    options: GetCommunitiesOptions,
  ): Promise<GetCommunitiesResult> {
    return __getCommunities.call(this, options);
  }

  async createCommunity(
    options: CreateCommunityOptions,
  ): Promise<CreateCommunityResult> {
    return __createCommunity.call(this, options);
  }

  async updateCommunity(
    options: UpdateCommunityOptions,
  ): Promise<UpdateCommunityResult> {
    return __updateCommunity.call(this, options);
  }

  async deleteCommunity(
    options: DeleteCommunityOptions,
  ): Promise<DeleteCommunityResult> {
    return __deleteCommunity.call(this, options);
  }

  async getChainNodes(
    options: GetChainNodesOptions,
  ): Promise<GetChainNodesResult> {
    return __getChainNodes.call(this, options);
  }

  async createChainNode(
    options: CreateChainNodeOptions,
  ): Promise<CreateChainNodeResult> {
    return __createChainNode.call(this, options);
  }

  async getRelatedCommunities(
    options: GetRelatedCommunitiesQuery,
  ): Promise<GetRelatedCommunitiesResult> {
    return __getRelatedCommunities.call(this, options);
  }

  async putCommunityStake(
    options: PutCommunityStakeOptions,
  ): Promise<PutCommunityStakeResult> {
    return __putCommunityStake.call(this, options);
  }

  async getCommunityStake(
    options: GetCommunitiesOptions,
  ): Promise<PutCommunityStakeResult> {
    return __getCommunityStake.call(this, options);
  }
}
