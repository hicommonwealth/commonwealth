import { AppError } from '@hicommonwealth/core';
import {
  CommunityAttributes,
  GroupAttributes,
  GroupPermissionAttributes,
  models,
  UserInstance,
} from '@hicommonwealth/model';
import { ForumActionsEnum, GroupMetadata } from '@hicommonwealth/schemas';
import { Requirement } from '@hicommonwealth/shared';
import { Op, Transaction } from 'sequelize';
import z from 'zod';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import validateMetadata from '../../util/requirementsModule/validateMetadata';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_controller';
import { ServerGroupsController } from '../server_groups_controller';

const MAX_GROUPS_PER_COMMUNITY = 20;

// Warning: validation errors
const Errors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

// Warning: the schema
export type CreateGroupOptions = {
  user: UserInstance;
  community: CommunityAttributes;
  metadata: z.infer<typeof GroupMetadata>;
  requirements: Requirement[];
  topics?: number[];
  systemManaged?: boolean;
  transaction?: Transaction;
};

// Warning: should be partial of the aggregate
export type CreateGroupResult = [GroupAttributes, TrackOptions];

export async function __createGroup(
  this: ServerGroupsController,
  {
    user,
    community,
    metadata,
    requirements,
    topics,
    systemManaged,
    transaction,
  }: CreateGroupOptions,
): Promise<CreateGroupResult> {
  // Warning: authorization
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    // @ts-expect-error StrictNullChecks
    communityId: community.id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.Unauthorized);
  }

  // Warning: validation
  const metadataValidationErr = validateMetadata(metadata);
  if (metadataValidationErr) {
    throw new AppError(`${Errors.InvalidMetadata}: ${metadataValidationErr}`);
  }

  // Warning: validation
  const requirementsValidationErr = validateRequirements(requirements);
  if (requirementsValidationErr) {
    throw new AppError(
      `${Errors.InvalidRequirements}: ${requirementsValidationErr}`,
    );
  }

  // Warning: invariant
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
  // @ts-expect-error StrictNullChecks
  if (topics?.length > 0 && topics.length !== topicsToAssociate.length) {
    // did not find all specified topics
    throw new AppError(Errors.InvalidTopics);
  }

  const createGroupWithTransaction = async (t: Transaction) => {
    const group = await this.models.Group.create(
      {
        // @ts-expect-error StrictNullChecks
        community_id: community.id,
        metadata,
        requirements,
        is_system_managed: !!systemManaged,
      },
      { transaction: t },
    );
    if (topicsToAssociate.length > 0) {
      const permissions = topicsToAssociate.map((topic) => ({
        group_id: group.id,
        topic_id: topic.id,
        allowed_actions: this.models.sequelize.literal(
          `ARRAY[${Object.values(ForumActionsEnum)
            .map((value) => `'${value}'`)
            .join(', ')}]::"enum_GroupPermissions_allowed_actions"[]`,
        ),
      }));

      await models.GroupPermission.bulkCreate(
        permissions as unknown as GroupPermissionAttributes[],
        { transaction: t },
      );
    }
    return group.toJSON();
  };

  let newGroup: GroupAttributes;
  if (transaction) {
    // use existing transaction
    newGroup = await createGroupWithTransaction(transaction);
  } else {
    // create new transaction
    newGroup = await this.models.sequelize.transaction(async (tx) => {
      return createGroupWithTransaction(tx);
    });
  }

  // Warning: move to middleware
  const analyticsOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_GROUP,
    community: community.id,
    userId: user.id,
  };

  return [newGroup, analyticsOptions];
}
