import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetPoll(): Query<typeof schemas.GetPoll> {
  return {
    ...schemas.GetPoll,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const polls = await models.Poll.findAll({
        where: { thread_id: payload.thread_id },
        include: { model: models.Vote, as: 'votes' },
      });

      return polls.map((poll) => poll.toJSON());
    },
  };
}
