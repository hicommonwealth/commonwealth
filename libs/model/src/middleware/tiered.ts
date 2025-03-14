import { Context, InvalidActor } from '@hicommonwealth/core';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
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

    // validate tier TODO: cache sliding window?
    if (creates) {
      // load amount of content created in the last hour
      const [{ last_creates }] = await models.sequelize.query<{
        last_creates: number;
      }>(
        `
        WITH
        threads AS (
          SELECT COUNT(T.*) as c 
          FROM
            "Threads" T
            JOIN "Addresses" A ON A."id" = T."address_id"
          WHERE 
            A."user_id" = :user_id AND
            T."created_at" >= NOW() - INTERVAL '1 hour'
        ),
        comments AS (
          SELECT COUNT(C.*) as c 
          FROM
            "Comments" C
            JOIN "Addresses" A ON A."id" = C."address_id"
          WHERE
            A."user_id" = :user_id AND
            C."created_at" >= NOW() - INTERVAL '1 hour'
        ),
        communities AS (
          SELECT COUNT(C.*) as c 
          FROM
            "Addresses" A
            JOIN "Communities" C ON C."id" = A."community_id"
          WHERE
            A."user_id" = :user_id AND
            A.role = "admin" AND -- proxy to community creator
            C."created_at" >= NOW() - INTERVAL '1 hour'
        )
        SELECT threads.c + comments.c + communities.c as c
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: { user_id: user.id },
        },
      );
      // compare with tier limits, throwing error if exceeded
      if (last_creates > tierLimitsPerHour[tier].create)
        throw new InvalidActor(actor, 'Exceeded content creation limit');
    }
    if (upvotes) {
      // load amount of upvotes in the last hour
      const [{ last_upvotes }] = await models.sequelize.query<{
        last_upvotes: number;
      }>(
        `
        SELECT COUNT(*) as c
        FROM "Reactions" R
        WHERE R."created_at" >= NOW() - INTERVAL '1 hour' AND
              R."created_by" = :user_id
        `,
        {
          type: QueryTypes.SELECT,
          raw: true,
          replacements: { user_id: actor.user.id },
        },
      );
      // compare with tier limits, throwing error if exceeded
      if (last_upvotes > tierLimitsPerHour[tier].upvote)
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
