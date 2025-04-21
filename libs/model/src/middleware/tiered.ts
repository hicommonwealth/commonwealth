import {
  cache,
  CacheNamespaces,
  Context,
  InvalidActor,
} from '@hicommonwealth/core';
import {
  hasTierRateLimits,
  USER_TIERS,
  UserTierMap,
} from '@hicommonwealth/shared';
import moment from 'moment';
import { Op } from 'sequelize';
import { ZodSchema } from 'zod';
import { config } from '../config';
import { models } from '../database';

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
  if (!config.DISABLE_TIER_RATE_LIMITS) {
    const cacheKey = builtKey(user_id, counter);
    const value = await cache().incrementKey(
      CacheNamespaces.Tiered_Counter,
      cacheKey,
      1,
      60,
    );
    return value;
  }
}

export function tiered({
  creates = false,
  upvotes = false,
  ai = { images: false, text: false },
  minTier = UserTierMap.IncompleteUser,
}: {
  creates?: boolean;
  upvotes?: boolean;
  ai?: { images?: boolean; text?: boolean };
  minTier?: UserTierMap;
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
    if (
      tier === UserTierMap.NewlyVerifiedWallet &&
      moment().diff(moment(user.created_at), 'weeks') >= 1
    )
      tier = UserTierMap.VerifiedWallet;

    // WARNING: If router is not authenticated before this middleware this will incorrectly bump user tier
    if (tier === UserTierMap.IncompleteUser)
      tier = UserTierMap.NewlyVerifiedWallet;
    if (tier > user.tier)
      await models.User.update({ tier }, { where: { id: user.id } });

    if (tier < minTier)
      throw new InvalidActor(
        actor,
        `Must be a user with tier above ${minTier}`,
      );

    // allow users with tiers above limits
    if (!hasTierRateLimits(tier)) return;
    const tierLimitsPerHour = USER_TIERS[tier].hourlyRateLimits;

    if (creates) {
      const last_creates = await getUserCount(user.id, 'creates');
      if (last_creates >= tierLimitsPerHour.create)
        throw new InvalidActor(actor, 'Exceeded content creation limit');
    }
    if (upvotes) {
      const last_upvotes = await getUserCount(user.id, 'upvotes');
      if (last_upvotes >= tierLimitsPerHour.upvote)
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
