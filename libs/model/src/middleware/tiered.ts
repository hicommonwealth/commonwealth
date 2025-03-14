import { Context, InvalidActor } from '@hicommonwealth/core';
import moment from 'moment';
import { ZodSchema } from 'zod';
import { models } from '../database';

const tierLimitsPerHour = [
  // tier 0 (bad aura)
  { create: 0, upvote: 0, ai: { images: 0, text: 0 } },

  // tier 1 (new account with verified address)
  {
    create: 1,
    upvote: 5,
    ai: {
      images: 2,
      text: 5,
    },
  },

  // tier 2 (1 week old account with verified address)
  { create: 2, upvote: 10, ai: { images: 4, text: 10 } },

  // tier 3 (email verified account - sso, or wallet with balance)
  {
    create: 5,
    upvote: 25,
    ai: {
      images: 10,
      text: 50,
    },
  },
];

export function tiered({
  creates = false,
  upvotes = false,
  ai = { images: false, text: false },
}: {
  creates?: boolean;
  upvotes?: boolean;
  ai?: { images?: boolean; text?: boolean };
}) {
  return async function ({ actor }: Context<ZodSchema, ZodSchema>) {
    if (!actor.user.id) throw new InvalidActor(actor, 'Must be a user');

    // load user tier
    const user = await models.User.findOne({
      where: { id: actor.user.id },
      attributes: ['tier', 'created_at', 'emailVerified'],
    });

    // deny tier 0 users
    if (!user || user.tier === 0)
      throw new InvalidActor(actor, 'Unverified user');

    // upgrade tier if necessary
    let tier = user.tier;
    if (tier < 3 && user.emailVerified) {
      await models.User.update({ tier: 3 }, { where: { id: actor.user.id } });
      tier = 3;
    } else if (
      tier < 2 &&
      moment().diff(moment(user.created_at), 'weeks') >= 1
    ) {
      await models.User.update({ tier: 2 }, { where: { id: actor.user.id } });
      tier = 2;
    }

    // validate tier
    if (creates) {
      // load amount of content created in the last hour
      // compare with tier limits, throwing error if exceeded
    }
    if (upvotes) {
      // load amount of upvotes in the last hour
      // compare with tier limits, throwing error if exceeded
    }
    if (ai.images) {
      // load amount of ai images created in the last hour
      // compare with tier limits, throwing error if exceeded
    }
    if (ai.text) {
      // load amount of ai text generated in the last hour
      // compare with tier limits, throwing error if exceeded
    }
  };
}
