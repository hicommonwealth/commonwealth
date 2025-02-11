import { command, logger, Policy } from '@hicommonwealth/core';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import { events } from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import _ from 'lodash';
import { CreateCommunity } from '../community';
import { models } from '../database';
import { systemActor } from '../middleware';
import { mustExist } from '../middleware/guards';
import { parseMomBotMention } from '../services/openai';

const log = logger(import.meta);

const inputs = {
  TwitterMomBotMentioned: events.TwitterMomBotMentioned,
};

// MomBotDatingPools (id, creator_twitter_id/name, creator_match_preferences, token_address, eth_chain_id, community_id)
// MomBotDatingPoolMatches (id, dating_pool_id, twitter_id/name, status [pending, denied, matched])

export function MomBotPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      TwitterMomBotMentioned: async ({ payload }) => {
        log.info('MomBotPolicy', payload);

        const aiRes = await parseMomBotMention(
          payload.note_tweet || payload.text,
        );

        if (!aiRes) {
          // TODO: should we still reply? -> answer: generic reply
          log.info(`This tweet is not a MomBot command`, payload);
          return;
        }

        // TODO: Launch token -> Ian TBD
        const tokenAddress = '';

        // TODO: pregenerate a wallet for the twitter user (unless the provide an address?)
        // -> https://magic.link/docs/wallets/features/wallet-pregen
        // -> https://magic.link/posts/wallet-pregeneration
        const creatorAddress = '';

        const communityName = `${payload.username}'s Pool`;

        const existingCommunity = await models.Community.findOne({
          where: {
            id: _.kebabCase(communityName.toLowerCase()),
          },
        });
        if (existingCommunity) {
          // TODO: do create a random id or can each user only have 1 dating pool?
          // TODO: how can we tell if this is just a retry of the same tweet processing vs new tweet
          // TODO: ANSWER NOOOO
        }

        const chainNode = await models.ChainNode.findOne({
          where: {
            eth_chain_id:
              config.APP_ENV === 'production'
                ? cp.ValidChains.Base
                : cp.ValidChains.SepoliaBase,
          },
        });
        mustExist('Chain Node', chainNode);

        // TODO: default symbol, name, tags, token_name
        // TODO: ideally this should be a in transaction with pinned token
        //  should we modify CreateCommunity to allow passing a pinned token on creation?
        const community = await command(CreateCommunity(), {
          actor: systemActor({ address: creatorAddress }),
          payload: {
            id: _.kebabCase(communityName.toLowerCase()),
            name: communityName,
            chain_node_id: chainNode.id!,
            description: `A community for ${payload.username} to find his date!`,
            social_links: [`https://x.com/${payload.username}`],
            tags: ['mombot'],
            directory_page_enabled: false,
            type: ChainType.Offchain,
            base: ChainBase.Ethereum,
            token_name: payload.username,
            default_symbol: '',
            // TODO: icon = twitter user PFP
          },
        });
        if (!community) {
          // TODO: why would this be undefined?
          return;
        }

        const pinnedToken = await models.PinnedToken.create({
          community_id: community.community.id!,
          contract_address: tokenAddress,
          chain_node_id: chainNode.id!,
        });

        // Reply to user with link to community + token info

        // TODO: how do we recover if this process fails halfway through
        //  e.g. check for existing token, community, tweet -> make idempotent
      },
    },
  };
}
