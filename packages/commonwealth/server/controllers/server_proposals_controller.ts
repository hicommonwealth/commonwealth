import { AppError, ServerError } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import { ChainNetwork } from '@hicommonwealth/shared';
import { ethers, providers } from 'ethers';
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

    // @ts-expect-error StrictNullChecks
    if (!contract.Contract.address) {
      throw new ServerError(
        `No contract address found for community ${communityId}`,
      );
    }

    if (
      // @ts-expect-error StrictNullChecks
      !contract.Contract.type ||
      // @ts-expect-error StrictNullChecks
      (contract.Contract.type !== ChainNetwork.Aave &&
        // @ts-expect-error StrictNullChecks
        contract.Contract.type !== ChainNetwork.Compound)
    ) {
      throw new AppError(
        `Proposal fetching not supported for community ${communityId}`,
      );
    }

    return {
      // @ts-expect-error StrictNullChecks
      address: contract.Contract.address,
      // @ts-expect-error StrictNullChecks
      type: contract.Contract.type,
    };
  }

  private async createEvmProvider(
    communityId: string,
  ): Promise<providers.JsonRpcProvider> {
    const ethNetworkUrl = await this.getRPCUrl(communityId);

    if (ethNetworkUrl.slice(0, 4) != 'http')
      throw new ServerError(
        `Invalid ethNetworkUrl: ${ethNetworkUrl}. Must be an HTTP URL.`,
      );

    try {
      return new ethers.providers.JsonRpcProvider(ethNetworkUrl);
    } catch (e) {
      throw new ServerError(
        `Failed to create EVM provider for ${communityId}. ${e}`,
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

    // @ts-expect-error StrictNullChecks
    if (!community.ChainNode.private_url && !community.ChainNode.url) {
      throw new ServerError(`No RPC URL found for community ${communityId}`);
    }

    // only Aave and Compound contracts on Ethereum are supported
    // Celo and Fantom public nodes are extremely slow/rate limited
    // so, it is not feasible to fetch proposals from them without
    // a private node, indexing the chain, or using an existing
    // indexer like TheGraph or SubQuery
    if (
      // @ts-expect-error StrictNullChecks
      community.ChainNode.name !== 'Ethereum (Mainnet)' ||
      // @ts-expect-error StrictNullChecks
      (community.network !== ChainNetwork.Aave &&
        // @ts-expect-error StrictNullChecks
        community.network !== ChainNetwork.Compound &&
        // @ts-expect-error StrictNullChecks
        community.base !== 'ethereum')
    ) {
      throw new AppError(
        `Proposal fetching not supported for community ${communityId}`,
      );
    }

    // @ts-expect-error StrictNullChecks
    return community.ChainNode.private_url || community.ChainNode.url;
  }
}
