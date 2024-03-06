import { AppError, Requirement } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommunityAttributes,
  GroupAttributes,
  GroupMetadata,
  UserInstance,
  sequelize,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import validateMetadata from '../../util/requirementsModule/validateMetadata';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_controller';
import { ServerGroupsController } from '../server_groups_controller';

const MAX_GROUPS_PER_COMMUNITY = 20;

// FIXME: validation errors
const Errors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

// FIXME: the schema
export type CreateGroupOptions = {
  user: UserInstance;
  community: CommunityAttributes;
  address: AddressInstance;
  metadata: GroupMetadata;
  requirements: Requirement[];
  topics?: number[];
};

// FIXME: should be partial of the aggregate
export type CreateGroupResult = [GroupAttributes, TrackOptions];

export async function __createGroup(
  this: ServerGroupsController,
  { user, community, metadata, requirements, topics }: CreateGroupOptions,
): Promise<CreateGroupResult> {
  // FIXME: authorization
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: community.id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.Unauthorized);
  }

  // FIXME: validation
  const metadataValidationErr = validateMetadata(metadata);
  if (metadataValidationErr) {
    throw new AppError(`${Errors.InvalidMetadata}: ${metadataValidationErr}`);
  }

  // FIXME: validation
  const requirementsValidationErr = validateRequirements(requirements);
  if (requirementsValidationErr) {
    throw new AppError(
      `${Errors.InvalidRequirements}: ${requirementsValidationErr}`,
    );
  }

  // FIXME: invariant
  const numCommunityGroups = await this.models.Group.count({
    where: {
      community_id: community.id,
    },
  });
  if (numCommunityGroups >= MAX_GROUPS_PER_COMMUNITY) {
    throw new AppError(Errors.MaxGroups);
  }

  const topicsToAssociate = await this.models.Topic.findAll({
    where: {
      id: {
        [Op.in]: topics || [],
      },
      community_id: community.id,
    },
  });
  if (topics?.length > 0 && topics.length !== topicsToAssociate.length) {
    // did not find all specified topics
    throw new AppError(Errors.InvalidTopics);
  }

  const newGroup = await this.models.sequelize.transaction(
    async (transaction) => {
      // create group
      const group = await this.models.Group.create(
        {
          community_id: community.id,
          metadata,
          requirements,
        },
        { transaction },
      );
      if (topicsToAssociate.length > 0) {
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
            },
            transaction,
          },
        );
      }
      return group.toJSON();
    },
  );

  // FIXME: move to middleware
  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_GROUP,
    community: community.id,
    userId: user.id,
  };

  return [newGroup, analyticsOptions];
}
