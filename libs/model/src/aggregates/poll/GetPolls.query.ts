import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetPolls(): Query<typeof schemas.GetPolls> {
  return {
    ...schemas.GetPolls,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { thread_id } = payload;
      const polls = await models.Poll.findAll({
        where: { thread_id },
        include: { model: models.Vote, as: 'votes' },
      });
      return polls.map((poll) => poll.toJSON());
    },
  };
}
