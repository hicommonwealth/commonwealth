import { logger, Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { findActiveContestManager } from 'model/src/utils/findActiveContestManager';
import { getChainNodeUrl } from 'model/src/utils/utils';
import { Op, QueryTypes } from 'sequelize';
import { models } from '../../database';

const MIN_TRADE_AMOUNT = 10 ** 6;

const log = logger(import.meta);

const inputs = {
  NamespaceDeployed: events.NamespaceDeployed,
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
  ContestContentAdded: events.ContestContentAdded,
  ContestContentUpvoted: events.ContestContentUpvoted,
};

export function UpgradeTierPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      NamespaceDeployed: async ({ payload }) => {
        const { nameSpaceAddress, _namespaceDeployer } = payload.parsedArgs;

        const community = await models.Community.findOne({
          where: { namespace_address: nameSpaceAddress },
        });
        if (!community) {
          log.warn(
            `Community not found for namespace address ${nameSpaceAddress}`,
          );
          return;
        }

        const namespaceCreatorAddress = await models.Address.findOne({
          where: { address: _namespaceDeployer },
          include: [
            {
              model: models.User,
              required: true,
            },
          ],
        });
        if (!namespaceCreatorAddress?.User) {
          log.warn(
            `Namespace creator user not found for address ${_namespaceDeployer}`,
          );
          return;
        }
        if (namespaceCreatorAddress.User.tier >= 4) return;

        await models.User.update(
          { tier: 4 },
          {
            where: {
              id: namespaceCreatorAddress.User.id,
              tier: {
                [Op.lt]: 4,
              },
            },
          },
        );
      },
      LaunchpadTokenTraded: async ({ payload }) => {
        const { token_address } = payload;

        const token = await models.LaunchpadToken.findOne({
          where: {
            token_address,
            creator_address: {
              [Op.ne]: null,
            },
          },
        });
        if (!token) {
          log.warn(
            `Token with creator not found for token address ${token_address}`,
          );
          return;
        }

        // check tier of token creator user
        const tokenCreatorAddress = await models.Address.findOne({
          where: {
            address: token.creator_address!,
          },
          include: [
            {
              model: models.User,
              required: true,
            },
          ],
        });
        if (!tokenCreatorAddress?.User) {
          log.warn(
            `Token creator user not found for address ${token.creator_address!}`,
          );
          return;
        }
        if (tokenCreatorAddress.User.tier >= 4) return;

        // if token has been traded above min amount, upgrade token creator to tier 4
        const [totalTraded] = await models.sequelize.query<{
          sum: number;
        }>(
          `SELECT SUM(community_token_amount) as sum FROM launchpad_trades WHERE token_address = :token_address`,
          {
            replacements: { token_address },
            type: QueryTypes.SELECT,
          },
        );

        if (totalTraded.sum > MIN_TRADE_AMOUNT) {
          await models.User.update(
            { tier: 4 },
            {
              where: {
                id: tokenCreatorAddress.User.id,
                tier: {
                  [Op.lt]: 4,
                },
                a,
              },
            },
          );
        }
      },
      ContestContentAdded: async ({ payload }) => {
        await onContestActivity(payload);
      },
      ContestContentUpvoted: async ({ payload }) => {
        await onContestActivity(payload);
      },
    },
  };
}

type ContestActivityPayload = {
  contest_address: string;
  contest_id?: number;
};

const onContestActivity = async ({
  contest_address,
  contest_id,
}: ContestActivityPayload) => {
  const contestManager = await findActiveContestManager(contest_address, {
    include: [
      {
        model: models.Community,
        required: true,
        include: [
          {
            model: models.ChainNode,
            required: true,
          },
        ],
      },
    ],
  });
  if (!contestManager) {
    log.warn(
      `Contest manager not found for contest address ${contest_address}`,
    );
    return;
  }

  const rpc = getChainNodeUrl({
    url: contestManager!.Community!.ChainNode!.url,
    private_url: contestManager!.Community!.ChainNode!.private_url,
  });

  const chain: commonProtocol.EvmProtocolChain = {
    eth_chain_id: contestManager.Community!.ChainNode!.eth_chain_id!,
    rpc,
  };

  const { contestBalance } = await commonProtocol.getContestScore(
    chain,
    contest_address,
    contestManager.prize_percentage!,
    contestManager.payout_structure,
    contest_id,
  );

  if (!contestBalance) {
    return;
  }

  // contest has been funded, upgrade contest creator to tier 4

  const contestCreatorAddress = await models.Address.findOne({
    where: {
      address: contestManager.creator_address!,
    },
    include: [
      {
        model: models.User,
        required: true,
      },
    ],
  });
  if (!contestCreatorAddress?.User) {
    log.warn(
      `Contest creator user not found for address ${contestManager.creator_address!}`,
    );
    return;
  }
  if (contestCreatorAddress.User.tier >= 4) return;

  await models.User.update(
    { tier: 4 },
    {
      where: {
        id: contestCreatorAddress.User.id,
        tier: {
          [Op.lt]: 4,
        },
      },
    },
  );
};
