import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';

export function GetPollVote(): Query<typeof schemas.GetPollVote> {
  return {
    ...schemas.GetPollVote,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const votes = await this.models.Vote.findAll({
        where: {
          poll_id: payload.poll_id,
        },
      });

      return votes.map((v) => v.toJSON());
    },
  };
}
