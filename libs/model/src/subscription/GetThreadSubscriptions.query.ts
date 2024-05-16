import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

const associationParams = [
  {
    model: models.Thread,
    as: 'Thread',
    // include: [
    //   {
    //     model: models.Address,
    //     as: 'Address',
    //   },
    //   {
    //     model: models.Community,
    //     required: false,
    //     where: { active: true },
    //   },
    // ],
  },
];

export function GetThreadSubscriptions(): Query<
  typeof schemas.GetThreadSubscriptions
> {
  return {
    ...schemas.GetThreadSubscriptions,
    auth: [],
    secure: true,
    body: async ({ actor }) => {
      return (
        await models.ThreadSubscription.findAll({
          where: {
            user_id: actor.user.id,
          },
          include: [...associationParams],
          logging: console.log,
        })
      ).map((subscription) => subscription.get({ plain: true }));
    },
  };
}
