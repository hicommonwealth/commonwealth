import { Policy, command } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { CreateToken, ProjectLaunchpadTrade } from '../aggregates/token';
import { models } from '../database';
import { systemActor } from '../middleware';

const inputs = {
  LaunchpadTokenCreated: events.LaunchpadTokenCreated,
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
};

export function LaunchpadPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      LaunchpadTokenCreated: async ({ payload }) => {
        const chainNode = await models.ChainNode.findOne({
          where: { eth_chain_id: payload.eth_chain_id },
        });
        await command(CreateToken(), {
          actor: systemActor({}),
          payload: {
            chain_node_id: chainNode!.id!,
            community_id: '', // not required for system actors
            transaction_hash: payload.transaction_hash,
          },
        });
      },
      LaunchpadTokenTraded: async ({ payload }) => {
        await command(ProjectLaunchpadTrade(), {
          actor: systemActor({}),
          payload,
        });
      },
    },
  };
}
