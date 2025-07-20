import { command, logger } from '@hicommonwealth/core';
import { CommonProtocolEventHandlerType } from '@hicommonwealth/evm-protocols';
import { QueryTypes } from 'sequelize';
import { RefreshCommunityMemberships } from '../../aggregates/community';
import {
  CreateToken,
  LinkGovernanceAddress,
  ProjectLaunchpadTrade,
} from '../../aggregates/token';
import { models } from '../../database';
import { systemActor } from '../../middleware';

const log = logger(import.meta);

async function findTokenHolderGroups(
  community_id: string,
  token_address: string,
) {
  const sql = `
      WITH G AS (SELECT id,
                        requirements - > 0 AS requirement,
                        (requirements - > 0 ->>'data')::jsonb AS data, ((requirements - > 0 ->>'data') ::jsonb->>'source')::jsonb AS source
      FROM
          "Groups"
      WHERE
          community_id = :community_id
        AND jsonb_array_length(requirements::jsonb) = 1
          )
      SELECT G.id
      FROM G
      WHERE requirement ->>'rule' = 'threshold'
        AND data ->>'threshold' = '0'
        AND source ->>'source_type' = 'erc20'
        AND source ->>'contract_address' = :token_address;`;

  return await models.sequelize.query<{ id: number }>(sql, {
    type: QueryTypes.SELECT,
    raw: true,
    replacements: { community_id, token_address },
  });
}

export function LaunchpadPolicy(): CommonProtocolEventHandlerType {
  return {
    'Launchpad.NewTokenCreated': async ({ payload }) => {
      await command(CreateToken(), {
        actor: systemActor({}),
        payload: {
          community_id: '', // community id is not known yet, but system actor has rights
          eth_chain_id: payload.eth_chain_id,
          transaction_hash: payload.transaction_hash,
        },
      });
    },
    'TokenCommunityManager.CommunityNamespaceCreated': async ({ payload }) => {
      await command(LinkGovernanceAddress(), {
        actor: systemActor({}),
        payload: {
          name: payload.parsedArgs.name,
          token: payload.parsedArgs.token,
          namespaceAddress: payload.parsedArgs.namespaceAddress,
          governanceAddress: payload.parsedArgs.governanceAddress,
        },
      });
    },
    'LPBondingCurve.Trade': async ({ payload }) => {
      const output = await command(ProjectLaunchpadTrade(), {
        actor: systemActor({}),
        payload: {
          block_timestamp: BigInt(payload.block_timestamp),
          transaction_hash: payload.transaction_hash,
          trader_address: payload.parsedArgs.trader,
          token_address: payload.parsedArgs.tokenAddress,
          is_buy: payload.parsedArgs.isBuy,
          eth_chain_id: payload.eth_chain_id,
          eth_amount: payload.parsedArgs.ethAmount,
          community_token_amount: payload.parsedArgs.tokenAmount,
          floating_supply: payload.parsedArgs.floatingSupply,
        },
      });

      // when token associated with a community, refresh token holder memberships
      if (output?.community_id) {
        const group_ids = await findTokenHolderGroups(
          output.community_id,
          payload.parsedArgs.tokenAddress,
        );
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
  };
}
