import { command, EventHandler } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { ZodUndefined } from 'zod';
import { systemActor } from '../../middleware';
import { CreateToken } from '../../token';

export const handleLaunchpadTokenCreated: EventHandler<
  'LaunchpadTokenCreated',
  ZodUndefined
> = async ({ payload }) => {
  const chainNode = await models.ChainNode.findOne({
    where: {
      eth_chain_id: payload.eventSource.ethChainId,
    },
  });
  await command(CreateToken(), {
    actor: systemActor({}),
    payload: {
      chain_node_id: chainNode!.id!,
      community_id: '', // not required for system actors
      transaction_hash: payload.rawLog.transactionHash,
    },
  });
};
