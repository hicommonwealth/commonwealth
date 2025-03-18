import { Context, InvalidActor } from '@hicommonwealth/core';
import moment from 'moment';
import { Op, QueryTypes } from 'sequelize';
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

/*
 * Gets amount of content created by user id in the last hour
 * TODO: cache creations by user to avoid db query?
 */
async function getLastHourCreates(user_id: number) {
  const [{ creates }] = await models.sequelize.query<{ creates: number }>(
    `
    SELECT 
      COALESCE(COUNT(DISTINCT T.id), 0) +
      COALESCE(COUNT(DISTINCT C.id), 0) +
      COALESCE(COUNT(DISTINCT CM.id), 0) AS creates
    FROM "Addresses" A
      LEFT JOIN "Threads" T ON A."id" = T."address_id" 
        AND T."created_at" >= NOW() - INTERVAL '1 hour'
      LEFT JOIN "Comments" C ON A."id" = C."address_id" 
        AND C."created_at" >= NOW() - INTERVAL '1 hour'
      LEFT JOIN "Communities" CM ON A."community_id" = CM."id" 
        AND A.role = 'admin' -- proxy to community creator
        AND CM."created_at" >= NOW() - INTERVAL '1 hour'
    WHERE A."user_id" = :user_id;
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { user_id },
    },
  );
  return +creates;
}

/*
 * Gets amount of upvotes made by user id in the last hour
 * TODO: cache upvotes by user to avoid db query?
 */
async function getLastHourUpvotes(user_id: number) {
  const [{ upvotes }] = await models.sequelize.query<{ upvotes: number }>(
    `
    SELECT COUNT(*) as upvotes
    FROM "Reactions" R JOIN "Addresses" A ON A."id" = R."address_id"
    WHERE R."created_at" >= NOW() - INTERVAL '1 hour' AND
          A."user_id" = :user_id
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: { user_id },
    },
  );
  return +upvotes;
}

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

    // allow users with tiers above limits
    if (tier >= tierLimitsPerHour.length) return;

    if (creates) {
      const last_creates = await getLastHourCreates(user.id);
      if (last_creates >= tierLimitsPerHour[tier].create)
        throw new InvalidActor(actor, 'Exceeded content creation limit');
    }
    if (upvotes) {
      const last_upvotes = await getLastHourUpvotes(user.id);
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
