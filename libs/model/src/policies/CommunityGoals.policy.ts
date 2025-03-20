import { Policy, command } from '@hicommonwealth/core';
import { CommunityGoalReached, events } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { z } from 'zod';
import { SetReachedGoal } from '../aggregates/community';
import { models } from '../database';
import { systemActor } from '../middleware';

const inputs = {
  CommunityJoined: events.CommunityJoined,
  ThreadCreated: events.ThreadCreated,
};

async function findOpenGoals(
  community_id: string,
  type: 'members' | 'threads',
) {
  const goals = await models.CommunityGoalReached.findAll({
    where: { community_id, reached_at: { [Op.is]: null } },
    include: [
      {
        model: models.CommunityGoalMeta,
        as: 'meta',
        required: true,
        where: { type },
      },
    ],
  });
  return goals.map((g) => g.toJSON());
}

async function setReachedGoal(
  goals: Array<z.infer<typeof CommunityGoalReached>>,
  target: number,
) {
  await Promise.all(
    goals.map(async (goal) => {
      if (goal.meta!.target <= target) {
        await command(SetReachedGoal(), {
          actor: systemActor({}),
          payload: {
            community_id: goal.community_id,
            community_goal_meta_id: goal.community_goal_meta_id,
          },
        });
      }
    }),
  );
}

export function CommunityGoalsPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityJoined: async ({ payload }) => {
        const { community_id } = payload;
        const goals = await findOpenGoals(community_id, 'members');
        if (goals.length) {
          const members = await models.Address.count({
            where: { community_id, verified: { [Op.not]: null } },
          });
          await setReachedGoal(goals, members);
        }
      },

      ThreadCreated: async ({ payload }) => {
        const { community_id } = payload;
        const goals = await findOpenGoals(community_id, 'threads');
        if (goals.length) {
          const threads = await models.Thread.count({
            where: { community_id, deleted_at: { [Op.is]: null } },
          });
          await setReachedGoal(goals, threads);
        }
      },
    },
  };
}
