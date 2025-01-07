import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Order } from 'sequelize';
import { models } from '../database';

export function GetContest(): Query<typeof schemas.GetContest> {
  return {
    ...schemas.GetContest,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const include = [];

      if (payload.with_chain_node) {
        include.push({
          model: models.Community,
          include: [
            {
              model: models.ChainNode.scope('withPrivateData'),
            },
          ],
        });
      }

      if (payload.with_contests) {
        include.push({
          model: models.Contest,
          as: 'contests',
          order: [['contest_id', 'ASC']] as Order,
        });
      }

      const contestManager = await models.ContestManager.findOne({
        where: {
          contest_address: payload.contest_address,
        },
        include,
      });

      if (contestManager?.contests) {
        contestManager.contests.forEach((contest: any) => {
          contest.start_time = new Date(contest.start_time);
          contest.end_time = new Date(contest.end_time);
        });
      }

      return contestManager;
    },
  };
}
