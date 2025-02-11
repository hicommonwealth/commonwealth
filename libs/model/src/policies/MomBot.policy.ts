import { logger, Policy } from '@hicommonwealth/core';
import { parseMomBotMention } from '@hicommonwealth/model';
import { events } from '@hicommonwealth/schemas';

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
          // TODO: should we still reply?
          log.info(`This tweet is not a MomBot command`, payload);
          return;
        }

        // TODO: Launch token -> Ian TBD
        const tokenAddress = '';

        // Create community
        // -> who do we make admin of the community?
        // -> https://magic.link/docs/wallets/features/wallet-pregen
        // -> https://magic.link/posts/wallet-pregeneration
        // -> pregenerate a wallet for the twitter user (unless the provide an address?)

        // Reply to user with link to community + token info

        // TODO: how do we recover if this process fails halfway through
        //  e.g. check for existing token, community, tweet -> make idempotent
      },
    },
  };
}
