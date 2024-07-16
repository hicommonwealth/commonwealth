import { InvalidActor, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Role } from '@hicommonwealth/shared';
import moment from 'moment';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

type QueryType = {
  community_id: string;
  admin_only_polling?: string;
  role: Role;
  user_id: number;
};

export function CreatePoll(): Query<typeof schemas.CreatePoll> {
  return {
    ...schemas.CreatePoll,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const { thread_id, address, prompt, options, custom_duration } = payload;

      const query: QueryType = (
        await models.sequelize.query(
          `
            SELECT c.id as community_id, c.admin_only_polling, a.role, a.user_id FROM "Threads" t
            JOIN "Addresses" a on t.address_id = a.id
            JOIN "Communities" c on c.id = a.community_id
            WHERE t.id = :thread_id AND a.address = :address AND a.user_id = :user_id
            LIMIT 1;
          `,
          {
            replacements: { thread_id, address, user_id: actor.user.id },
            raw: true,
            type: QueryTypes.SELECT,
          },
        )
      )?.[0];

      if (!query) {
        throw new InvalidActor(actor, 'User is not the author of the thread');
      }

      if (query.admin_only_polling && query.role !== 'admin') {
        throw new InvalidActor(
          actor,
          'Only admins are allowed to create polls for this community',
        );
      }

      const poll = await models.sequelize.transaction(async (transaction) => {
        await models.Thread.update(
          { has_poll: true },
          { where: { id: thread_id }, transaction },
        );

        console.log(moment().add(custom_duration, 'days').toDate());

        return await models.Poll.create(
          {
            thread_id,
            community_id: query.community_id,
            prompt,
            options: JSON.stringify(options),
            ends_at:
              custom_duration !== undefined
                ? moment().add(custom_duration, 'days').toDate()
                : undefined,
          },
          { transaction },
        );
      });

      return poll.toJSON() as any;
    },
  };
}
