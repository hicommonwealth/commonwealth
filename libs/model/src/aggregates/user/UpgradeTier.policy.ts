import { logger, Policy } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { events } from '@hicommonwealth/schemas';
import { UserTierMap } from '@hicommonwealth/shared';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { models } from '../../database';
import {
  USDC_BASE_MAINNET_ADDRESS,
  USDC_BASE_SEPOLIA_ADDRESS,
} from '../../services/openai/parseBotCommand';
import { findActiveContestManager } from '../../utils/findActiveContestManager';
import { getChainNodeUrl } from '../../utils/utils';

export const UPGRADE_MIN_TRADE_AMOUNT = 250_000_000_000_000_000n; // 2.5 * 10^17
export const UPGRADE_MIN_USDC_BALANCE = 50_000_000_000_000_000_000n; // 50 * 10^18
export const UPGRADE_MIN_LAUNCHPAD_BALANCE = 1_000_000_000_000_000_000n; // 1 * 10^18

const log = logger(import.meta);

const inputs = {
  LaunchpadTokenTraded: events.LaunchpadTokenTraded,
  ContestContentAdded: events.ContestContentAdded,
  ContestContentUpvoted: events.ContestContentUpvoted,
};

export function UpgradeTierPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      // TODO: update to nomination event

      // NamespaceTransferSingle: async ({ payload }) => {
      //   const {
      //     parsedArgs: { from, to: userAddress, id: tokenId },
      //     rawLog: { address: namespaceAddress },
      //   } = payload;
      //   if (tokenId !== BigInt(NAMESPACE_COMMUNITY_NOMINATION_TOKEN_ID)) return; // must be community nomination token

      //   if (from !== ZERO_ADDRESS) return; // must be minted

      //   const community = await models.Community.findOne({
      //     where: { namespace_address: namespaceAddress },
      //   });
      //   if (!community) {
      //     log.warn(
      //       `Community not found for namespace address ${namespaceAddress}`,
      //     );
      //     return;
      //   }

      //   const nominatedAddress = await models.Address.findOne({
      //     where: { address: userAddress },
      //     include: [
      //       {
      //         model: models.User,
      //         required: true,
      //       },
      //     ],
      //   });
      //   if (!nominatedAddress?.User) {
      //     log.warn(`User not found for address ${userAddress}`);
      //     return;
      //   }
      //   if (nominatedAddress.User.tier >= UserTierMap.ChainVerified) return;

      //   // if user has sufficient balance of community nomination token, upgrade to ChainVerified tier
      //   const balances = await tokenBalanceCache.getBalances({
      //     addresses: [nominatedAddress.address],
      //     balanceSourceType: BalanceSourceType.ERC1155,
      //     sourceOptions: {
      //       evmChainId: payload.eventSource.ethChainId,
      //       contractAddress: community.namespace_address!,
      //       tokenId: NAMESPACE_COMMUNITY_NOMINATION_TOKEN_ID,
      //     },
      //     cacheRefresh: true,
      //   });
      //   const balance = parseInt(balances[nominatedAddress.address] ?? '0');
      //   if (balance < NAMESPACE_MIN_NOMINATION_BALANCE) return;

      //   await upgradeUserTier(
      //     nominatedAddress!.User!.id!,
      //     UserTierMap.ChainVerified,
      //   );
      // },
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
        if (tokenCreatorAddress.User.tier >= UserTierMap.ChainVerified) return;

        // if token has been traded above min amount, upgrade token creator to ChainVerified tier
        const [totalTraded] = await models.sequelize.query<{
          sum: number;
        }>(
          `SELECT SUM(community_token_amount) as sum FROM launchpad_trades WHERE token_address = :token_address`,
          {
            replacements: { token_address },
            type: QueryTypes.SELECT,
          },
        );

        if (totalTraded.sum > UPGRADE_MIN_TRADE_AMOUNT) {
          await upgradeUserTier(
            tokenCreatorAddress.User.id!,
            UserTierMap.ChainVerified,
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

const upgradeUserTier = async (
  userId: number,
  toTier: number,
  transaction?: Transaction,
) => {
  await models.User.update(
    { tier: toTier },
    {
      where: {
        id: userId,
        tier: {
          [Op.lt]: toTier,
        },
      },
      transaction,
    },
  );
};

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
  if (!contestManager?.Community?.ChainNode) {
    log.warn(
      `Active contest manager with chain node not found for contest address ${contest_address}`,
    );
    return;
  }

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

  if (contestCreatorAddress.User.tier >= UserTierMap.ChainVerified) return;

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

  const contestBalanceInt = BigInt(contestBalance ?? '0');

  if (!contestBalanceInt) {
    return;
  }

  // must be USDC or launchpad token

  const isUSDC = [
    USDC_BASE_MAINNET_ADDRESS,
    USDC_BASE_SEPOLIA_ADDRESS,
  ].includes(contestManager.funding_token_address!);

  const isLaunchpadToken = !!(await models.LaunchpadToken.findOne({
    where: {
      // launchpad token addresses are all lowercase
      token_address: contestManager.funding_token_address!.toLowerCase(),
    },
  }));

  if (
    (isUSDC && contestBalanceInt >= UPGRADE_MIN_USDC_BALANCE) ||
    (isLaunchpadToken && contestBalanceInt >= UPGRADE_MIN_LAUNCHPAD_BALANCE)
  ) {
    // contest has been funded, upgrade contest creator to ChainVerified tier
    await upgradeUserTier(
      contestCreatorAddress.User.id!,
      UserTierMap.ChainVerified,
    );
  } else {
    log.warn(
      `Contest funding token not approved for contest ${contest_address}`,
    );
    return;
  }
};
