import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { mustExist } from 'model/src/middleware';
import { Op } from 'sequelize';
import { models } from '../../database';

export function GetLastJudgedContest(): Query<
  typeof schemas.GetLastJudgedContest
> {
  return {
    ...schemas.GetLastJudgedContest,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const contestManager = await models.ContestManager.findOne({
        where: {
          contest_address: payload.contest_address,
          namespace_judge_token_id: {
            [Op.ne]: null,
          },
        },
        order: [['created_at', 'DESC']],
      });

      mustExist('Contest Manager', contestManager);

      return contestManager;
    },
  };
}
