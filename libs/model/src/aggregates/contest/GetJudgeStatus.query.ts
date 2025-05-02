import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

// const Errors = {};

export function GetJudgeStatus(): Query<typeof schemas.GetJudgeStatus> {
  return {
    ...schemas.GetJudgeStatus,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const lastContestManager = await models.ContestManager.findOne({
        where: {
          community_id: payload.community_id,
        },
        order: [['namespace_judge_token_id', 'DESC']],
      });

      return {
        current_judge_id: lastContestManager?.namespace_judge_token_id || null,
      };
    },
  };
}
