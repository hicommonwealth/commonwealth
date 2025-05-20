import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetPollVotes(): Query<typeof schemas.GetPollVotes> {
  return {
    ...schemas.GetPollVotes,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { poll_id } = payload;
      const votes = await models.Vote.findAll({ where: { poll_id } });
      return votes.map((v) => v.toJSON());
    },
  };
}
