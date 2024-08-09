import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  DB,
  GroupAttributes,
  GroupPermissionAttributes,
  GroupPermissionInstance,
  TopicInstance,
  UserInstance,
  sequelize,
} from '@hicommonwealth/model';
import {
  ForumActions,
  ForumActionsEnum,
  GroupMetadata,
} from '@hicommonwealth/schemas';
import { Requirement } from '@hicommonwealth/shared';
import { Op, Transaction, WhereOptions } from 'sequelize';
import z from 'zod';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import validateMetadata from '../../util/requirementsModule/validateMetadata';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_controller';
import { ServerGroupsController } from '../server_groups_controller';

const Errors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  GroupNotFound: 'Group not found',
  InvalidTopics: 'Invalid topics',
  SystemManaged: 'Cannot update group that is system-managed',
};

export type UpdateGroupOptions = {
  user: UserInstance;
  address: AddressInstance;
  groupId: number;
  allowedActions?: ForumActions[];
  metadata?: z.infer<typeof GroupMetadata>;
  requirements?: Requirement[];
  topics?: number[];
  allowList?: number[];
};

export type UpdateGroupResult = [GroupAttributes, TrackOptions];

export async function __updateGroup(
  this: ServerGroupsController,
  {
    user,
    groupId,
    metadata,
    requirements,
    topics,
    allowedActions,
  }: UpdateGroupOptions,
): Promise<UpdateGroupResult> {
  const group = await this.models.Group.findByPk(groupId);
  if (!group) {
    throw new AppError(Errors.GroupNotFound);
  }

  const isAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: group.community_id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.Unauthorized);
  }

  if (group.is_system_managed) {
    throw new AppError(Errors.SystemManaged);
  }

  // allow metadata and requirements to be omitted
  if (typeof metadata !== 'undefined') {
    const metadataValidationErr = validateMetadata(metadata);
    if (metadataValidationErr) {
      throw new AppError(`${Errors.InvalidMetadata}: ${metadataValidationErr}`);
    }
  }
  if (typeof requirements !== 'undefined') {
    const requirementsValidationErr = validateRequirements(requirements);
    if (requirementsValidationErr) {
      throw new AppError(
        `${Errors.InvalidRequirements}: ${requirementsValidationErr}`,
      );
    }
  }

  let topicsToAssociate: TopicInstance[];
  if (typeof topics !== 'undefined') {
    topicsToAssociate = await this.models.Topic.findAll({
      where: {
        id: {
          [Op.in]: topics || [],
        },
        community_id: group.community_id,
      },
    });
    if (topics?.length > 0 && topics.length !== topicsToAssociate.length) {
      // did not find all specified topics
      throw new AppError(Errors.InvalidTopics);
    }
  }

  // update the group
  const toUpdate: Partial<GroupAttributes> = {};
  if (typeof metadata !== 'undefined') {
    toUpdate.metadata = metadata;
  }

  if (typeof requirements !== 'undefined') {
    toUpdate.requirements = requirements;
  }

  await sequelize.transaction(async (transaction) => {
    if (toUpdate.requirements?.length) {
      // delete all existing memberships for group
      await this.models.Membership.destroy({
        where: {
          group_id: group.id,
        },
        transaction,
      });
    }

    // update group
    await group.update(toUpdate, { transaction });

    // if associated with some topics, update the groupPermissions
    if (topics) {
      group.groupPermissions = await updateGroupPermissions(
        topics,
        allowedActions ?? Object.values(ForumActionsEnum),
        group.id,
        this.models,
        transaction,
      );
    }
  });

  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.UPDATE_GROUP,
    community: group.community_id,
    userId: user.id,
  };

  return [group.toJSON(), analyticsOptions];
}

async function updateGroupPermissions(
  topics: number[],
  allowed_actions: ForumActions[],
  group_id: number,
  models: DB,
  transaction: Transaction,
): Promise<GroupPermissionInstance[]> {
  const existingGroupPermissions = await models.GroupPermission.findAll({
    where: { group_id },
  });

  const existingTopicIds = existingGroupPermissions.map(
    (permission) => permission.topic_id,
  );

  const permissionsToRemove = existingTopicIds.filter(
    (id) => !topics.includes(id!),
  );
  const permissionsToUpsert = topics.filter(
    (id) => !permissionsToRemove.includes(id!),
  );

  if (permissionsToRemove.length > 0) {
    await models.GroupPermission.destroy({
      where: {
        group_id,
        topic_id: { [Op.in]: permissionsToRemove },
      } as WhereOptions<GroupPermissionAttributes>,
      transaction,
    });
  }

  if (permissionsToUpsert.length === 0) {
    return Promise.resolve([]);
  }

  const upsertGroupPermissions = permissionsToUpsert.map((topic_id) => ({
    group_id,
    topic_id,
    allowed_actions,
  }));

  const upsertPromises = upsertGroupPermissions.map((p) =>
    models.sequelize.query(
      `
            INSERT INTO "GroupPermissions" (group_id, topic_id, allowed_actions, created_at, updated_at) VALUES
            (:groupId, :topicId, Array[:allowedActions]::"enum_GroupPermissions_allowed_actions"[], NOW(), NOW())
            ON CONFLICT (group_id, topic_id) DO UPDATE
            SET
                allowed_actions = EXCLUDED.allowed_actions,
                updated_at = EXCLUDED.updated_at
            RETURNING *;
          `,
      {
        raw: true,
        replacements: {
          groupId: p.group_id,
          topicId: p.topic_id,
          allowedActions: p.allowed_actions,
        },
        transaction,
      },
    ),
  );

  return (await Promise.all(upsertPromises)) as unknown as Promise<
    GroupPermissionInstance[]
  >;
}
