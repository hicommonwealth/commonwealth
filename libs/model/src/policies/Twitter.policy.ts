import { TokenLaunchpadAbi } from '@commonxyz/common-protocol-abis';
import {
  command,
  CustomRetryStrategyError,
  EventContext,
  logger,
  Policy,
} from '@hicommonwealth/core';
import {
  commonProtocol as cp,
  createPrivateEvmClient,
  erc20Abi,
  ValidChains,
} from '@hicommonwealth/evm-protocols';
import { models, parseCreateOnCommonMentioned } from '@hicommonwealth/model';
import { events } from '@hicommonwealth/schemas';
import {
  slugifyPreserveDashes,
  UserTierMap,
  WalletId,
  WalletSsoSource,
} from '@hicommonwealth/shared';
import { WalletWithMetadata } from '@privy-io/server-auth';
import { QueryTypes } from 'sequelize';
import { LaunchTokenBot } from '../aggregates/bot';
import { CreateThread } from '../aggregates/thread';
import { privyClient } from '../aggregates/user/signIn/privyUtils';
import { config } from '../config';
import { awardTweetEngagementXp, HttpError } from '../services/twitter';

const log = logger(import.meta);

const inputs = {
  TweetEngagementCapReached: events.TweetEngagementCapReached,
  TwitterCreateOnCommonMentioned: events.TwitterCreateOnCommonMentioned,
};

export function TwitterPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TweetEngagementCapReached: async ({ payload }) => {
        try {
          await awardTweetEngagementXp(payload);
        } catch (error) {
          if (error instanceof HttpError && error.statusCode === 400) {
            log.error('Error awarding tweet engagement xp', error);
            // dead letter immediately since retries will not help
            throw new CustomRetryStrategyError(
              'Error awarding tweet engagement xp',
              { strategy: 'nack' },
            );
          } else if (error instanceof HttpError && error.statusCode === 429) {
            // rate limit exceeded
            throw new CustomRetryStrategyError('Rate limit exceeded', [
              { strategy: 'republish', defer: 60_000 * 5, attempts: 3 },
              { strategy: 'nack' },
            ]);
          } else {
            throw error;
          }
        }
      },
      TwitterCreateOnCommonMentioned: async ({ payload }) => {
        /**
         * { symbol: BTC, community: null } -> create community + launchpad token called BTC
         * { symbol: BTC, community: Whalers } -> create post coin
         */
        let symbol: string | undefined;
        let launchpadTokenName: string | undefined | null;
        try {
          const res = await parseCreateOnCommonMentioned(payload.text);
          symbol = res.symbol;
          launchpadTokenName = res.community;
        } catch (e) {
          // TODO
        }
        if (!symbol) return;

        const user = await getCommonUserFromTweet(payload);
        const actor = {
          user: {
            id: user.user_id,
            email: '',
          },
          address: user.address,
        };

        // create community + launchpad token
        if (!launchpadTokenName) {
          // use symbol as community name
          launchpadTokenName = symbol + ' Token';
          const communityId =
            payload.id + '-' + slugifyPreserveDashes(launchpadTokenName);

          const res = await command(LaunchTokenBot(), {
            actor,
            payload: {
              id: communityId,
              name: launchpadTokenName,
              symbol,
              eth_chain_id: ValidChains.Base,
              icon_url: '', // TODO
              description: `${symbol} token community created by ${payload.username} on X`,
              totalSupply: 1e18, // TODO
            },
          });
          if (!res) throw new Error('Failed to create community');
          const { token_address, community_url } = res;

          return await replyToTweet();
        }

        // Create post coin
        const launchpad = await models.LaunchpadToken.findOne({
          where: {
            name: launchpadTokenName,
          },
        });
        if (!launchpad) {
          // Reply to Tweet that launchpad not found
          return await replyToTweet();
        }
        const community = await models.Community.findOne({
          where: {
            namespace: launchpad.namespace,
          },
          include: [
            {
              model: models.ChainNode,
              required: true,
            },
          ],
        });
        if (!community) {
          // TODO
          throw new Error('Failed to find community');
        }

        const thread = await command(CreateThread(), {
          actor,
          payload: {},
        });
        if (!thread) throw new Error('Failed to create thread');

        if (!config.WEB3.LAUNCHPAD_PRIVATE_KEY)
          throw new Error('Missing private key');
        const client = createPrivateEvmClient({
          rpc: community.ChainNode!.private_url || community.ChainNode!.url,
          privateKey: config.WEB3.LAUNCHPAD_PRIVATE_KEY,
        });
        const launchpadFactory = new client.eth.Contract(
          TokenLaunchpadAbi,
          launchpad.token_address,
        );
        // TODO: use CreatePostCoinBot.command
        const postToken = await cp.launchPostToken(
          launchpadFactory,
          launchpadTokenName,
          symbol,
          [8250, 1650, 100],
          [user.address],
          client.utils.toWei('1e9', 'ether'),
          client.defaultAccount!,
          830000,
          thread.id!,
          launchpad.token_address,
          0.01e18, // TODO
          new client.eth.Contract(erc20Abi, launchpad.token_address),
        );
        await models.Thread.update(
          {
            launchpad_token_address: '',
            is_linking_token: false,
          },
          {
            where: {
              id: thread.id,
            },
          },
        );
      },
    },
  };
}

async function getCommonUserFromTweet(
  payload: EventContext<'TwitterCreateOnCommonMentioned'>['payload'],
): Promise<{
  address: string;
  user_id: number;
}> {
  const addresses = await models.sequelize.query<{
    address: string;
    user_id: number;
  }>(
    `
      SELECT address, user_id
      FROM "Addresses"
      WHERE oauth_username = :username
        AND oauth_provider = :provider
      GROUP BY address, user_id
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        username: payload.username,
        provider: WalletSsoSource.Twitter,
      },
      raw: true,
    },
  );
  let admin: { address: string; user_id: number } | undefined;
  if (addresses.length) {
    admin = addresses[0];
  } else {
    const privyUser = await privyClient.importUser({
      linkedAccounts: [
        {
          type: 'twitter_oauth',
          username: payload.username,
          subject: payload.author_id,
          name: null,
        },
      ],
      createEthereumWallet: true,
      createSolanaWallet: true,
    });
    const privyWallet = privyUser.linkedAccounts.find(
      (w) => w.type === 'wallet' && w.chainType === 'ethereum',
    );
    if (!privyWallet) {
      throw new CustomRetryStrategyError('Ethereum wallet not created', {
        strategy: 'nack',
      });
    }

    await models.sequelize.transaction(async (transaction) => {
      const user = await models.User.create(
        {
          email: null,
          profile: {
            name: payload.username,
          },
          tier: UserTierMap.SocialVerified,
          privy_id: privyUser.id,
        },
        { transaction },
      );
      const address = await models.Address.create(
        {
          address: (privyWallet as WalletWithMetadata).address,
          community_id: 'ethereum',
          user_id: user.id!,
          wallet_id: WalletId.Privy,
          role: 'member',
          is_user_default: true,
          ghost_address: false,
          is_banned: false,
          oauth_provider: WalletSsoSource.Twitter,
          oauth_username: payload.username,
        },
        { transaction },
      );
      admin = { address: address.address, user_id: user.id! };
    });
  }
  return admin!;
}

async function replyToTweet() {}
