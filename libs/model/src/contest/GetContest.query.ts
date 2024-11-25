import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';

export function GetContest(): Query<typeof schemas.GetContest> {
  return {
    ...schemas.GetContest,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const include = payload.with_chain_node
        ? [
            {
              model: models.Community,
              include: [
                {
                  model: models.ChainNode.scope('withPrivateData'),
                },
              ],
            },
          ]
        : [];
      const contestManager = await models.ContestManager.findOne({
        where: {
          contest_address: payload.contest_address,
        },
        include,
      });
      return contestManager;
    },
  };
}
