import { Policy, command, logger } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { RefreshCommunityMemberships } from '../aggregates/community';
import { CreateToken, ProjectLaunchpadTrade } from '../aggregates/token';
import { models } from '../database';
import { systemActor } from '../middleware';

const log = logger(import.meta);

const inputs = {
  LaunchpadTokenCreated: events.LaunchpadTokenCreated,
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
};

async function findTokenHolderGroups(
  community_id: string,
  token_address: string,
) {
  const sql = `
  WITH G AS (
    SELECT id,
     requirements->0 AS requirement,
     (requirements->0->>'data')::jsonb AS data,
     ((requirements->0->>'data')::jsonb->>'source')::jsonb AS source
    FROM
      "Groups"
    WHERE
      community_id = :community_id
      AND jsonb_array_length(requirements::jsonb) = 1
  )
  SELECT G.id
  FROM G
  WHERE requirement->>'rule' = 'threshold'
    AND data->>'threshold' = '0'
    AND source->>'source_type' = 'erc20'
    AND source->>'contract_address' = :token_address;`;

  return await models.sequelize.query<{ id: number }>(sql, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: { community_id, token_address },
  });
}

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
        const output = await command(ProjectLaunchpadTrade(), {
          actor: systemActor({}),
          payload,
        });

        // when token associated with a community, refresh token holder memberships
        if (output?.community_id) {
          const group_ids = await findTokenHolderGroups(
            output.community_id,
            payload.token_address,
          );
          console.log({ community_id: output.community_id, group_ids });
          if (group_ids.length)
            await command(RefreshCommunityMemberships(), {
              actor: systemActor({}),
              payload: {
                community_id: output.community_id,
                group_id: group_ids[0].id,
                refresh_all: true,
              },
            }).catch((err) => {
              log.error(
                `Failed to refresh token holder memberships for community ${output.community_id}: ${err}`,
              );
            });
        }
      },
    },
  };
}
