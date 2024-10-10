/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

export interface UpdateCommunityResponseChainNode {
  id?: number;
  url?: string;
  ethChainId?: number;
  altWalletUrl?: string;
  privateUrl?: string;
  balanceType?: CommonApi.UpdateCommunityResponseChainNodeBalanceType;
  name?: string;
  description?: string;
  ss58?: number;
  bech32?: string;
  slip44?: number;
  cosmosChainId?: string;
  cosmosGovVersion?: CommonApi.UpdateCommunityResponseChainNodeCosmosGovVersion;
  health?: CommonApi.UpdateCommunityResponseChainNodeHealth;
  contracts?: CommonApi.UpdateCommunityResponseChainNodeContractsItem[];
  blockExplorer?: string;
  maxCeBlockRange?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
