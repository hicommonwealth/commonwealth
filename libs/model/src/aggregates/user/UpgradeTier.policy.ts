import { logger, Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { findActiveContestManager } from 'model/src/utils/findActiveContestManager';
import { getChainNodeUrl } from 'model/src/utils/utils';
import { Op, QueryTypes } from 'sequelize';
import { models } from '../../database';
import { tokenBalanceCache } from '../../services';

const MIN_TRADE_AMOUNT = 10 ** 6;

const log = logger(import.meta);

const inputs = {
  TransferSingle: events.TransferSingle,
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
  ContestContentAdded: events.ContestContentAdded,
  ContestContentUpvoted: events.ContestContentUpvoted,
};

export function UpgradeTierPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TransferSingle: async ({ payload }) => {
        const { from: namespaceAddress, to: judge } = payload.parsedArgs;

        const community = await models.Community.findOne({
          where: { namespace_address: namespaceAddress },
        });
        if (!community) {
          log.warn(
            `Community not found for namespace address ${namespaceAddress}`,
          );
          return;
        }

        const nominatedAddress = await models.Address.findOne({
          where: { address: judge },
          include: [
            {
              model: models.User,
              required: true,
            },
          ],
        });
        if (!nominatedAddress?.User) {
          log.warn(`Judge user not found for address ${judge}`);
          return;
        }
        if (nominatedAddress.User.tier >= 4) return;

        // if judge has sufficient balance of community nomination token, upgrade to tier 4
        const balances = await tokenBalanceCache.getBalances({
          addresses: [nominatedAddress.address],
          balanceSourceType: BalanceSourceType.ERC1155,
          sourceOptions: {
            evmChainId: community.ChainNode!.eth_chain_id!,
            contractAddress: community.namespace_address!,
            tokenId: 3,
          },
        });
        const balance = parseInt(balances[nominatedAddress.address] ?? '0');
        if (balance < 5) return;

        await models.User.update(
          { tier: 4 },
          {
            where: {
              id: nominatedAddress.User.id,
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
