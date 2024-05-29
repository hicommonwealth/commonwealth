import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  GroupAttributes,
  TopicInstance,
  UserInstance,
  sequelize,
} from '@hicommonwealth/model';
import { GroupMetadata } from '@hicommonwealth/schemas';
import { Requirement } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
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
  metadata?: z.infer<typeof GroupMetadata>;
  requirements?: Requirement[];
  topics?: number[];
  allowList?: number[];
};

export type UpdateGroupResult = [GroupAttributes, TrackOptions];

export async function __updateGroup(
  this: ServerGroupsController,
  { user, groupId, metadata, requirements, topics }: UpdateGroupOptions,
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

    if (topicsToAssociate) {
      // add group to all specified topics
      await this.models.Topic.update(
        {
          group_ids: sequelize.fn(
            'array_append',
            sequelize.col('group_ids'),
            group.id,
          ),
        },
        {
          where: {
            id: {
              [Op.in]: topicsToAssociate.map(({ id }) => id),
            },
            [Op.not]: {
              group_ids: {
                [Op.contains]: [group.id],
              },
            },
          },
          transaction,
        },
      );

      // remove group from existing group topics
      await this.models.Topic.update(
        {
          group_ids: sequelize.fn(
            'array_remove',
            sequelize.col('group_ids'),
            group.id,
          ),
        },
        {
          where: {
            id: {
              [Op.notIn]: topicsToAssociate.map(({ id }) => id),
            },
            group_ids: {
              [Op.contains]: [group.id],
            },
          },
          transaction,
        },
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
