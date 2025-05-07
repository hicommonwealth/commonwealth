import {
  command,
  CustomRetryStrategyError,
  EventContext,
  logger,
  Policy,
} from '@hicommonwealth/core';
import { ValidChains } from '@hicommonwealth/evm-protocols';
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
import { privyClient } from '../aggregates/user/signIn/privyUtils';
import { mustExist } from '../middleware';
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
         * { symbol: BTC, community: Whalers }
         *    -> Find or create community -> find or create launchpad token -> create post coin
         */
        let symbol: string | undefined;
        let communityName: string | undefined | null;
        try {
          const res = await parseCreateOnCommonMentioned(payload.text);
          symbol = res.symbol;
          communityName = res.community;
        } catch (e) {
          // TODO
        }
        if (!symbol) return;

        const user = await getCommonUserFromTweet(payload);

        // create community + launchpad token
        if (!communityName) {
          // use symbol as community name
          communityName = symbol + ' Token';
          const communityId =
            payload.id + '-' + slugifyPreserveDashes(communityName);

          const { community_url, token_address, name } = await command(
            LaunchTokenBot(),
            {
              actor: {
                user: {
                  id: user.user_id,
                  email: '',
                },
                address: user.address,
              },
              payload: {
                id: communityId,
                name: communityName,
                symbol,
                eth_chain_id: ValidChains.Base,
                icon_url: '', // TODO
                description: `${symbol} token community created by ${payload.username} on X`,
                totalSupply: 1e18, // TODO
              },
            },
          );

          return await replyToTweet();
        }

        // Find or create community -> find or create launchpad token -> create post coin

        const communityId =
          payload.id + '-' + slugifyPreserveDashes(communityName);
        let community = await models.Community.findOne({
          where: {
            id: communityId,
          },
        });
        const chainNode = await models.ChainNode.findOne({
          where: {
            eth_chain_id: ValidChains.Base,
          },
        });
        mustExist('Chain Node', chainNode);
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
