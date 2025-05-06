import {
  command,
  CustomRetryStrategyError,
  logger,
  Policy,
} from '@hicommonwealth/core';
import { ValidChains } from '@hicommonwealth/evm-protocols';
import { models, parseCreateOnCommonMentioned } from '@hicommonwealth/model';
import { events } from '@hicommonwealth/schemas';
import {
  ChainBase,
  ChainType,
  slugifyPreserveDashes,
} from '@hicommonwealth/shared';
import { LaunchTokenBot } from '../aggregates/bot';
import { CreateCommunity } from '../aggregates/community/CreateCommunity.command';
import { mustExist, systemActor } from '../middleware';
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
        try {
          const { symbol, community: communityName } =
            await parseCreateOnCommonMentioned(payload.text);
          const communityId =
            payload.id + '-' + slugifyPreserveDashes(communityName);

          await models.User.findOne({});

          await command(LaunchTokenBot(), {
            actor: {},
            payload: {
              id: communityId,
              name: communityName,
              symbol,
              eth_chain_id: ValidChains.Base,
              icon_url: '', // TODO
              description: `${symbol} token community created by ${payload.username} on X`,
              totalSupply: 1e18, // TODO
            },
          });

          let community = await models.Community.findOne({
            where: {
              id: communityId,
            },
          });

          if (!community) {
            const chainNode = await models.ChainNode.findOne({
              where: {
                eth_chain_id: ValidChains.Base,
              },
            });
            mustExist('Chain Node', chainNode);

            const res = await command(CreateCommunity(), {
              actor: systemActor({}),
              payload: {
                id: communityId,
                name: communityName,
                chain_node_id: chainNode.id!,
                icon_url: '', // TODO: generate image?
                social_links: [],
                tags: ['Launchpad'],
                directory_page_enabled: false,
                type: ChainType.Token,
                base: ChainBase.Ethereum,
                allow_tokenized_threads: false,
                token_name: symbol,
                default_symbol: symbol,
              },
            });
            community = res.community;
          }
        } catch (e) {}
      },
    },
  };
}
