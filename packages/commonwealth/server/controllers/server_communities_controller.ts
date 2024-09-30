import { CommunityStakeAttributes, DB } from '@hicommonwealth/model';
import {
  CreateChainNodeOptions,
  CreateChainNodeResult,
  __createChainNode,
} from './server_communities_methods/create_chain_node';
import {
  PostCommunityStakeOptions,
  __createCommunityStake,
} from './server_communities_methods/create_community_stake';
import {
  GetChainNodesOptions,
  GetChainNodesResult,
  __getChainNodes,
} from './server_communities_methods/get_chain_nodes';
import {
  GetCommunityStakeOptions,
  GetCommunityStakeResult,
  __getCommunityStake,
} from './server_communities_methods/get_community_stake';
import {
  GetRelatedCommunitiesQuery,
  GetRelatedCommunitiesResult,
  __getRelatedCommunities,
} from './server_communities_methods/get_related_communities';
import {
  SearchCommunitiesOptions,
  SearchCommunitiesResult,
  __searchCommunities,
} from './server_communities_methods/search_communities';
import {
  UpdateCommunityIdOptions,
  UpdateCommunityIdResult,
  __updateCommunityId,
} from './server_communities_methods/update_community_id';

/**
 * Implements methods related to communities
 */
export class ServerCommunitiesController {
  constructor(public models: DB) {}

  async searchCommunities(
    options: SearchCommunitiesOptions,
  ): Promise<SearchCommunitiesResult> {
    return __searchCommunities.call(this, options);
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

  async createCommunityStake(
    options: PostCommunityStakeOptions,
  ): Promise<CommunityStakeAttributes> {
    return __createCommunityStake.call(this, options);
  }

  async getCommunityStake(
    options: GetCommunityStakeOptions,
  ): Promise<GetCommunityStakeResult> {
    return __getCommunityStake.call(this, options);
  }

  async updateCommunityId(
    options: UpdateCommunityIdOptions,
  ): Promise<UpdateCommunityIdResult> {
    return __updateCommunityId.call(this, options);
  }
}
