import { command, EventHandler } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';
import { LinkNamespace } from '../../aggregates/community';
import { systemActor } from '../../middleware';

export const handleNamespaceDeployedWithReferral: EventHandler<
  'NamespaceDeployedWithReferral',
  ZodUndefined
> = async ({ payload }) => {
  const {
    referrer: referrer_address,
    namespaceDeployer: referee_address,
    nameSpaceAddress: namespace_address,
  } = payload.parsedArgs;

  await command(LinkNamespace(), {
    actor: systemActor({}),
    payload: {
      namespace_address,
      deployer_address: referee_address,
      log_removed: payload.rawLog.removed,
      referral: referee_address
        ? {
            referrer_address,
            referee_address,
            timestamp: payload.block.timestamp,
            eth_chain_id: payload.eventSource.ethChainId,
            transaction_hash: payload.rawLog.transactionHash,
          }
        : undefined,
    },
  });
};
