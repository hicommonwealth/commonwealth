/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';

export const CreateGroupRequestRequirementsItemThresholdDataSourceOne =
  core.serialization.object({
    sourceType: core.serialization.property(
      'source_type',
      core.serialization.stringLiteral('eth_native'),
    ),
    evmChainId: core.serialization.property(
      'evm_chain_id',
      core.serialization.number(),
    ),
  });
