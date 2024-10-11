/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';

export const GetCommunityResponseAddressesChainNodeContractsItem =
  core.serialization.object({
    id: core.serialization.number(),
    address: core.serialization.string(),
    chainNodeId: core.serialization.property(
      'chain_node_id',
      core.serialization.number(),
    ),
    abiId: core.serialization.property(
      'abi_id',
      core.serialization.number().optional(),
    ),
    decimals: core.serialization.number().optional(),
    tokenName: core.serialization.property(
      'token_name',
      core.serialization.string().optional(),
    ),
    symbol: core.serialization.string().optional(),
    type: core.serialization.string(),
    isFactory: core.serialization.property(
      'is_factory',
      core.serialization.boolean().optional(),
    ),
    nickname: core.serialization.string().optional(),
    createdAt: core.serialization.property(
      'created_at',
      core.serialization.date().optional(),
    ),
    updatedAt: core.serialization.property(
      'updated_at',
      core.serialization.date().optional(),
    ),
  });
