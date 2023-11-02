import { Op } from 'sequelize';
import { AppError } from '../../../../common-common/src/errors';
import { sequelize } from '../../database';
import { AddressInstance } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { GroupAttributes, GroupMetadata } from '../../models/group';
import { UserInstance } from '../../models/user';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import validateMetadata from '../../util/requirementsModule/validateMetadata';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { validateOwner } from '../../util/validateOwner';
import { ServerCommunitiesController } from '../server_communities_controller';

const MAX_GROUPS_PER_COMMUNITY = 20;

const Errors = {
  InvalidMetadata: 'Invalid requirements',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

export type CreateGroupOptions = {
  user: UserInstance;
  community: CommunityInstance;
  address: AddressInstance;
  metadata: GroupMetadata;
  requirements: Requirement[];
  topics?: number[];
};

export type CreateGroupResult = GroupAttributes;

export async function __createGroup(
  this: ServerCommunitiesController,
  { user, community, metadata, requirements, topics }: CreateGroupOptions,
): Promise<CreateGroupResult> {
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: community.id,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.Unauthorized);
  }

  const metadataValidationErr = validateMetadata(metadata);
  if (metadataValidationErr) {
    throw new AppError(`${Errors.InvalidMetadata}: ${metadataValidationErr}`);
  }

  const requirementsValidationErr = validateRequirements(requirements);
  if (requirementsValidationErr) {
    throw new AppError(
      `${Errors.InvalidRequirements}: ${requirementsValidationErr}`,
    );
  }

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
      chain_id: community.id,
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

  return newGroup;
}
