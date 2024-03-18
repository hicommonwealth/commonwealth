import { AppError, ChainNetwork, ServerError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { providers } from 'ethers';
import {
  GetProposalVotesOptions,
  GetProposalVotesResult,
  __getProposalVotes,
} from './server_proposal_methods/get_proposal_votes';
import {
  GetProposalsOptions,
  GetProposalsResult,
  __getProposals,
} from './server_proposal_methods/get_proposals';

export type SupportedProposalNetworks =
  | ChainNetwork.Aave
  | ChainNetwork.Compound;

export type ContractInfo = {
  address: string;
  type: SupportedProposalNetworks;
};

export class ServerProposalsController {
  constructor(public models: DB) {}

  public async getProposals(
    options: GetProposalsOptions,
  ): Promise<GetProposalsResult> {
    const contractInfo = await this.getContractInfo(options.communityId);
    const provider = await this.createEvmProvider(options.communityId);
    return __getProposals.call(
      this,
      options,
      provider,
      contractInfo,
      this.models,
    );
  }

  public async getProposalVotes(
    options: GetProposalVotesOptions,
  ): Promise<GetProposalVotesResult> {
    const contractInfo = await this.getContractInfo(options.communityId);
    const provider = await this.createEvmProvider(options.communityId);
    return __getProposalVotes.call(this, options, provider, contractInfo);
  }

  private async getContractInfo(communityId: string): Promise<ContractInfo> {
    const contract = await this.models.CommunityContract.findOne({
      where: {
        community_id: communityId,
      },
      attributes: [],
      include: [
        {
          model: this.models.Contract,
          required: true,
          attributes: ['address', 'type'],
        },
      ],
    });

    if (!contract.Contract.address) {
      throw new ServerError(
        `No contract address found for community ${communityId}`,
      );
    }

    if (
      !contract.Contract.type ||
      (contract.Contract.type !== ChainNetwork.Aave &&
        contract.Contract.type !== ChainNetwork.Compound)
    ) {
      throw new AppError(
        `Proposal fetching not supported for community ${communityId}`,
      );
    }

    return {
      address: contract.Contract.address,
      type: contract.Contract.type,
    };
  }

  private async createEvmProvider(
    communityId: string,
  ): Promise<providers.Web3Provider> {
    const ethNetworkUrl = await this.getRPCUrl(communityId);

    if (ethNetworkUrl.slice(0, 4) != 'http')
      throw new ServerError(
        `Invalid ethNetworkUrl: ${ethNetworkUrl}. Must be an HTTP URL.`,
      );

    try {
      const Web3 = (await import('web3')).default;
      const web3Provider = new Web3.providers.HttpProvider(ethNetworkUrl);
      return new providers.Web3Provider(web3Provider);
    } catch (e) {
      throw new ServerError(
        `Failed to create EVM provider for ${ethNetworkUrl}. ${e}`,
      );
    }
  }

  private async getRPCUrl(communityId: string): Promise<string> {
    const community = await this.models.Community.findOne({
      where: {
        id: communityId,
      },
      attributes: ['network', 'base'],
      include: [
        {
          model: this.models.ChainNode.scope('withPrivateData'),
          required: true,
        },
      ],
    });

    if (!community.ChainNode.private_url && !community.ChainNode.url) {
      throw new ServerError(`No RPC URL found for community ${communityId}`);
    }

    // only Aave and Compound contracts on Ethereum are supported
    // Celo and Fantom public nodes are extremely slow/rate limited
    // so, it is not feasible to fetch proposals from them without
    // a private node, indexing the chain, or using an existing
    // indexer like TheGraph or SubQuery
    if (
      community.ChainNode.name !== 'Ethereum (Mainnet)' ||
      (community.network !== ChainNetwork.Aave &&
        community.network !== ChainNetwork.Compound &&
        community.base !== 'ethereum')
    ) {
      throw new AppError(
        `Proposal fetching not supported for community ${communityId}`,
      );
    }

    return community.ChainNode.private_url || community.ChainNode.url;
  }
}
