import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { GatedActionEnum } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models, sequelize } from '../../database';
import { authRoles } from '../../middleware';
import { mustNotExist } from '../../middleware/guards';
import { GroupAttributes } from '../../models';
import { emitEvent } from '../../utils/utils';

export const MAX_GROUPS_PER_COMMUNITY = 20;

export const CreateGroupErrors = {
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

export function CreateGroup(): Command<typeof schemas.CreateGroup> {
  return {
    ...schemas.CreateGroup,
    auth: [authRoles('admin')],
    body: async ({ actor, payload }) => {
      const { community_id } = payload;

      const topics = await models.Topic.findAll({
        where: {
          id: { [Op.in]: payload.topics?.map((t) => t.id) || [] },
          community_id,
        },
      });
      if (payload.topics?.length !== topics.length)
        throw new InvalidInput(CreateGroupErrors.InvalidTopics);

      const groups = await models.Group.findAll({
        where: { community_id },
        attributes: ['metadata'],
        raw: true,
      });
      mustNotExist(
        'Group',
        groups.find((g) => g.metadata.name === payload.metadata.name),
      );
      if (groups.length >= MAX_GROUPS_PER_COMMUNITY)
        throw new InvalidInput(CreateGroupErrors.MaxGroups);

      const newGroup = await models.sequelize.transaction(
        async (transaction) => {
          const group = await models.Group.create(
            {
              community_id,
              metadata: payload.metadata,
              requirements: payload.requirements,
              is_system_managed: false,
            } as GroupAttributes,
            { transaction },
          );
          if (topics.length > 0) {
            // add group to all specified topics
            if (group.id) {
              // add topic level interaction permissions for current group
              const groupGatedActions = (payload.topics || []).map((t) => ({
                group_id: group.id!,
                topic_id: t.id,
                is_private: !!t.is_private,
                gated_actions: sequelize.literal(
                  `ARRAY[${t.permissions
                    .map((p) => `'${p}'`)
                    .join(', ')}]::"enum_GroupGatedActions_gated_actions"[]`,
                ) as unknown as GatedActionEnum[],
              }));
              await models.GroupGatedAction.bulkCreate(groupGatedActions, {
                transaction,
              });
            }
          }

          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'GroupCreated',
                event_payload: {
                  community_id,
                  group_id: group.id!,
                  creator_user_id: actor.user.id!,
                  created_at: group.created_at!,
                },
              },
            ],
            transaction,
          );

          return group.toJSON();
        },
      );

      return { id: community_id, groups: [newGroup] };
    },
  };
}
