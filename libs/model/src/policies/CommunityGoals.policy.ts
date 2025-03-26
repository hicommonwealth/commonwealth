import { Policy, command } from '@hicommonwealth/core';
import { CommunityGoalReached, events } from '@hicommonwealth/schemas';
import { CommunityGoalType } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { z } from 'zod';
import { SetReachedGoal } from '../aggregates/community';
import { models } from '../database';
import { systemActor } from '../middleware';

const inputs = {
  CommunityCreated: events.CommunityCreated,
  CommunityUpdated: events.CommunityUpdated,
  CommunityJoined: events.CommunityJoined,
  CommunityTagsUpdated: events.CommunityTagsUpdated,
  GroupCreated: events.GroupCreated,
  ThreadCreated: events.ThreadCreated,
  RoleUpdated: events.RoleUpdated,
};

async function findOpenGoals(community_id: string, type: CommunityGoalType) {
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
  await models.sequelize.transaction(async (transaction) => {
    await Promise.all(
      goals.map(async (goal) => {
        if (goal.meta!.target <= target) {
          await command(SetReachedGoal(transaction), {
            actor: systemActor({}),
            payload: {
              community_id: goal.community_id,
              community_goal_meta_id: goal.community_goal_meta_id,
              goal_type: goal.meta!.type,
            },
          });
        }
      }),
    );
  });
}

export function CommunityGoalsPolicy(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommunityCreated: async ({ payload }) => {
        const { community_id } = payload;
        const goals = await findOpenGoals(community_id, 'social-links');
        if (goals.length) {
          const community = await models.Community.findOne({
            where: { id: community_id },
          });
          const links = community?.social_links?.filter(Boolean) || [];
          await setReachedGoal(goals, links.length);
        }
      },

      CommunityUpdated: async ({ payload }) => {
        const { community_id } = payload;
        const goals = await findOpenGoals(community_id, 'social-links');
        if (goals.length) {
          const community = await models.Community.findOne({
            where: { id: community_id },
          });
          const links = community?.social_links?.filter(Boolean) || [];
          await setReachedGoal(goals, links.length);
        }
      },

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

      CommunityTagsUpdated: async ({ payload }) => {
        const { community_id } = payload;
        const goals = await findOpenGoals(community_id, 'tags');
        if (goals.length) {
          const tags = await models.CommunityTags.count({
            where: { community_id },
          });
          await setReachedGoal(goals, tags);
        }
      },

      GroupCreated: async ({ payload }) => {
        const { community_id } = payload;
        const goals = await findOpenGoals(community_id, 'groups');
        if (goals.length) {
          const groups = await models.Group.count({
            where: { community_id },
          });
          await setReachedGoal(goals, groups);
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

      RoleUpdated: async ({ payload }) => {
        const { community_id, role } = payload;
        if (role === 'moderator') {
          const goals = await findOpenGoals(community_id, 'moderators');
          if (goals.length) {
            const moderators = await models.Address.count({
              where: { community_id, role },
            });
            await setReachedGoal(goals, moderators);
          }
        }
      },
    },
  };
}
