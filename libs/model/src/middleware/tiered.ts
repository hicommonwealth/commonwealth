import {
  CacheNamespaces,
  Context,
  InvalidActor,
  cache,
} from '@hicommonwealth/core';
import moment from 'moment';
import { Op } from 'sequelize';
import { ZodSchema } from 'zod';
import { models } from '../database';

const tierLimitsPerHour = [
  // tier 0 (new unverified addresses with no sso, balance, etc - bad aura)
  { create: 0, upvote: 0, ai: { images: 0, text: 0 } },
  // tier 1 (new verified address)
  { create: 1, upvote: 5, ai: { images: 2, text: 5 } },
  // tier 2 (1 week old and verified)
  { create: 2, upvote: 10, ai: { images: 4, text: 10 } },
  // tier 3 (email verified/sso, or wallet with balance (TODO: cache balances))
  { create: 5, upvote: 25, ai: { images: 10, text: 50 } },
];

function builtKey(user_id: number, counter: 'creates' | 'upvotes') {
  return `${user_id}-${counter}-${new Date().toISOString().substring(0, 13)}`;
}

async function getUserCount(user_id: number, counter: 'creates' | 'upvotes') {
  const cacheKey = builtKey(user_id, counter);
  const count = await cache().getKey(CacheNamespaces.Tiered_Counter, cacheKey);
  return +(count ?? '0');
}

export async function incrementUserCount(
  user_id: number,
  counter: 'creates' | 'upvotes',
) {
  const cacheKey = builtKey(user_id, counter);
  const value = await cache().incrementKey(
    CacheNamespaces.Tiered_Counter,
    cacheKey,
    1,
    60,
  );
  return value;
}

export function tiered({
  creates = false,
  upvotes = false,
  ai = { images: false, text: false },
  minTier = 0,
}: {
  creates?: boolean;
  upvotes?: boolean;
  ai?: { images?: boolean; text?: boolean };
  minTier?: number;
}) {
  return async function ({ actor }: Context<ZodSchema, ZodSchema>) {
    if (!actor.user.id) throw new InvalidActor(actor, 'Must be a user');

    const user = await models.User.findOne({
      where: { id: actor.user.id },
      attributes: ['id', 'tier', 'created_at'],
      include: [
        {
          model: models.Address,
          required: true,
          where: { verified: { [Op.ne]: null } },
        },
      ],
    });
    if (!user?.id) throw new InvalidActor(actor, 'Unverified user');

    // upgrade tier after a week
    let tier = user.tier;
    if (tier < 2 && moment().diff(moment(user.created_at), 'weeks') >= 1)
      tier = 2;
    if (tier < 1) tier = 1;
    if (tier > user.tier)
      await models.User.update({ tier }, { where: { id: user.id } });

    if (tier < minTier)
      throw new InvalidActor(
        actor,
        `Must be a user with tier above ${minTier}`,
      );

    // allow users with tiers above limits
    if (tier >= tierLimitsPerHour.length) return;

    if (creates) {
      const last_creates = await getUserCount(user.id, 'creates');
      if (last_creates >= tierLimitsPerHour[tier].create)
        throw new InvalidActor(actor, 'Exceeded content creation limit');
    }
    if (upvotes) {
      const last_upvotes = await getUserCount(user.id, 'upvotes');
      if (last_upvotes >= tierLimitsPerHour[tier].upvote)
        throw new InvalidActor(actor, 'Exceeded upvote limit');
    }
    if (ai.images) {
      // TODO: add tiered to ai image creation
      // load amount of ai images created in the last hour
      // compare with tier limits, throwing error if exceeded
    }
    if (ai.text) {
      // TODO: add tiered to ai text creation
      // load amount of ai text generated in the last hour
      // compare with tier limits, throwing error if exceeded
    }
  };
}
