import { AppError, InvalidActor, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { models } from '../database';

type QueryType = {
  thread_id: number;
  user_id: number;
};

export function DeletePoll(): Query<typeof schemas.DeletePoll> {
  return {
    ...schemas.DeletePoll,
    auth: [],
    secure: true,
    body: async ({ actor, payload }) => {
      const { poll_id } = payload;

      const query: QueryType[] = (
        await models.sequelize.query(
          `
             SELECT t.id as thread_id, a.user_id FROM "Polls" p
             JOIN "Threads" t ON t.id = p.thread_id
             JOIN "Addresses" a ON t.address_id = a.id
             WHERE a.user_id = :user_id AND p.id = :poll_id
             LIMIT 1;
          `,
          {
            replacements: { poll_id, user_id: actor.user.id },
            raw: true,
            type: QueryTypes.SELECT,
          },
        )
      )?.[0];

      if (!query) {
        throw new AppError('Poll does not exist');
      }

      if (actor.user.id !== query.user_id) {
        throw new InvalidActor(actor, 'User does not own the poll');
      }

      await models.sequelize.transaction(async (transaction) => {
        await models.Vote.destroy({
          where: { poll_id },
          transaction,
        });

        await models.Poll.destroy({
          where: { id: poll_id },
          transaction,
        });

        await models.Thread.update(
          { has_poll: false },
          { where: { id: query.thread_id }, transaction },
        );
      });

      return {};
    },
  };
}
