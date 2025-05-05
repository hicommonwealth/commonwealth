import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  BalanceSourceType,
  bumpTier,
  CommunityTierMap,
  NAMESPACE_COMMUNITY_NOMINATION_TOKEN_ID,
} from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { emitEvent } from '../../utils';

const log = logger(import.meta);

async function updateReferralCount(
  referrer_address: string,
  transaction: Transaction,
) {
  const referrer = await models.User.findOne({
    include: [
      {
        model: models.Address,
        where: { address: referrer_address },
      },
    ],
    transaction,
  });
  referrer &&
    (await referrer.update(
      {
        referral_count: models.sequelize.literal(`
        (SELECT COUNT(DISTINCT referee_address)
        FROM "Referrals"
        WHERE referrer_address IN (
          SELECT address from "Addresses" WHERE user_id = ${referrer.id!}
        ))
      `),
      },
      { transaction },
    ));
}

async function setReferral(
  namespace_address: string,
  log_removed: boolean,
  {
    referrer_address,
    referee_address,
    timestamp,
    eth_chain_id,
    transaction_hash,
  }: z.infer<typeof schemas.NamespaceReferral>,
  transaction: Transaction,
) {
  const existingReferral = await models.Referral.findOne({
    where: { namespace_address, referrer_address },
    transaction,
  });

  // handle on-chain log removals
  if (existingReferral) {
    if (
      existingReferral.transaction_hash === transaction_hash &&
      existingReferral.eth_chain_id === eth_chain_id
    ) {
      if (log_removed) {
        await existingReferral.destroy({ transaction });
        await updateReferralCount(referrer_address, transaction);
      }
      return;
    }
    throw new Error(
      `Found referral of namespace ${namespace_address} with mismatched chain details`,
    );
  }

  await models.Referral.create(
    {
      namespace_address,
      referrer_address,
      referee_address,
      eth_chain_id,
      transaction_hash,
      referrer_received_eth_amount: 0n,
      created_on_chain_timestamp: BigInt(timestamp),
    },
    { transaction },
  );
  await updateReferralCount(referrer_address, transaction);
}

export function LinkNamespace(): Command<typeof schemas.LinkNamespace> {
  return {
    ...schemas.LinkNamespace,
    auth: [],
    body: async ({ payload }) => {
      const { namespace_address, deployer_address, log_removed, referral } =
        payload;

      const community = await models.Community.findOne({
        where: { namespace_address },
        include: [
          {
            model: models.ChainNode,
            required: true,
          },
        ],
      });
      if (!community) {
        log.warn(
          `Community not found for namespace ${namespace_address}, skipping link`,
        );
        return;
      }

      if (!log_removed) bumpTier(CommunityTierMap.ChainVerified, community);

      community.namespace_creator_address = deployer_address;

      await models.sequelize.transaction(async (transaction) => {
        await community.save({ transaction });

        // create on-chain namespace groups if not already created
        const NAMESPACE_ADMINS_GROUP_NAME = 'Namespace Admins';
        const COMMUNITY_NOMINATED_GROUP_NAME = 'Community Nominated';

        if (log_removed) {
          await models.Group.destroy({
            where: {
              community_id: community.id,
              metadata: {
                name: {
                  [Op.in]: [
                    NAMESPACE_ADMINS_GROUP_NAME,
                    COMMUNITY_NOMINATED_GROUP_NAME,
                  ],
                },
              },
              is_system_managed: true,
            },
            transaction,
          });
        } else {
          await models.Group.findOrCreate({
            where: {
              community_id: community.id,
              metadata: { name: NAMESPACE_ADMINS_GROUP_NAME },
              is_system_managed: true,
            },
            defaults: {
              community_id: community.id,
              metadata: {
                name: NAMESPACE_ADMINS_GROUP_NAME,
                description: 'Users with onchain namespace admin privileges',
                required_requirements: 1,
              },
              requirements: [
                {
                  rule: 'threshold',
                  data: {
                    threshold: '0', // must have more than 0 tokens
                    source: {
                      source_type: BalanceSourceType.ERC1155,
                      evm_chain_id: community.ChainNode!.eth_chain_id!,
                      contract_address: namespace_address,
                      token_id: '0',
                    },
                  },
                },
              ],
              is_system_managed: true,
            },
            transaction,
          });

          await models.Group.findOrCreate({
            where: {
              community_id: community.id,
              metadata: { name: COMMUNITY_NOMINATED_GROUP_NAME },
              is_system_managed: true,
            },
            defaults: {
              community_id: community.id,
              metadata: {
                name: COMMUNITY_NOMINATED_GROUP_NAME,
                description: 'Users nominated',
                required_requirements: 1,
              },
              requirements: [
                {
                  rule: 'threshold',
                  data: {
                    threshold: '4', // must have 5 or more tokens
                    source: {
                      source_type: BalanceSourceType.ERC1155,
                      evm_chain_id: community.ChainNode!.eth_chain_id!,
                      contract_address: namespace_address,
                      token_id:
                        NAMESPACE_COMMUNITY_NOMINATION_TOKEN_ID.toString(),
                    },
                  },
                },
              ],
              is_system_managed: true,
            },
            transaction,
          });
        }

        // project referral details
        if (referral)
          await setReferral(
            namespace_address,
            log_removed,
            referral,
            transaction,
          );

        if (!log_removed) {
          // don't emit if chain event represents a log removal
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'NamespaceLinked',
                event_payload: {
                  namespace_address,
                  deployer_address,
                  community_id: community.id,
                  referral,
                  created_at: new Date(),
                },
              },
            ],
            transaction,
          );
        }
      });

      return true;
    },
  };
}
