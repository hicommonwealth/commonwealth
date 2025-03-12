import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { Transaction } from 'sequelize';
import { z } from 'zod';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';
import { emitEvent } from '../../utils';

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
        (SELECT COUNT(DISTINCT referee_address) FROM "Referrals" 
         WHERE referrer_address = ${models.sequelize.escape(referrer_address)})
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
      mustExist('Community', community);

      await models.sequelize.transaction(async (transaction) => {
        // create on-chain namespace admin group if not already created
        const GROUP_NAME = 'Namespace Admins';
        if (!log_removed) {
          // TODO: should we remove group when log is removed?
          // TODO: should we add any default users to this group?
          await models.Group.findOrCreate({
            where: {
              community_id: community.id,
              metadata: { name: GROUP_NAME },
            },
            defaults: {
              community_id: community.id,
              metadata: {
                name: GROUP_NAME,
                description: 'Users with onchain namespace admin privileges',
                required_requirements: 1,
              },
              requirements: [
                {
                  rule: 'threshold',
                  data: {
                    threshold: '0',
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
          await emitEvent(models.Outbox, [
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
          ]);
        }
      });

      return true;
    },
  };
}
