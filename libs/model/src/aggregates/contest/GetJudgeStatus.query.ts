import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';

export function GetJudgeStatus(): Query<typeof schemas.GetJudgeStatus> {
  return {
    ...schemas.GetJudgeStatus,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      // First, check for existing contest managers with judge token IDs
      const lastContestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.community_id,
          namespace_judge_token_id: {
            [Op.ne]: null,
          },
        },
        paranoid: false, // also include deleted contest managers
        order: [['namespace_judge_token_id', 'DESC']],
      });

      if (lastContestManager?.namespace_judge_token_id) {
        return {
          current_judge_id: lastContestManager.namespace_judge_token_id,
        };
      }

      const community = await models.Community.findOne({
        where: { id: payload.community_id },
        attributes: ['pending_namespace_judge_token_id'],
      });

      return {
        current_judge_id: community?.pending_namespace_judge_token_id || null,
      };
    },
  };
}
