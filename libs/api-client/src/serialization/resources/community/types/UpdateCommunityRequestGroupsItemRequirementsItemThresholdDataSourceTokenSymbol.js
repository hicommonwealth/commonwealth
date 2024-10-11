/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';

export const UpdateCommunityRequestGroupsItemRequirementsItemThresholdDataSourceTokenSymbol =
  core.serialization.object({
    sourceType: core.serialization.property(
      'source_type',
      core.serialization.stringLiteral('cosmos_native'),
    ),
    cosmosChainId: core.serialization.property(
      'cosmos_chain_id',
      core.serialization.string(),
    ),
    tokenSymbol: core.serialization.property(
      'token_symbol',
      core.serialization.string(),
    ),
  });
