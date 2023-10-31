import { Op } from 'sequelize';
import { TopicInstance } from 'server/models/topic';
import { AppError } from '../../../../common-common/src/errors';
import { sequelize } from '../../database';
import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { GroupAttributes, GroupMetadata } from '../../models/group';
import { UserInstance } from '../../models/user';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import validateMetadata from '../../util/requirementsModule/validateMetadata';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { validateOwner } from '../../util/validateOwner';
import { ServerCommunitiesController } from '../server_communities_controller';

const Errors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  GroupNotFound: 'Group not found',
  InvalidTopics: 'Invalid topics',
};

export type UpdateGroupOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  groupId: number;
  metadata?: GroupMetadata;
  requirements?: Requirement[];
  topics?: number[];
};

export type UpdateGroupResult = GroupAttributes;

export async function __updateGroup(
  this: ServerCommunitiesController,
  { user, chain, groupId, metadata, requirements, topics }: UpdateGroupOptions
): Promise<UpdateGroupResult> {
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    chainId: chain.id,
    allowMod: true,
    allowAdmin: true,
    allowGodMode: true,
  });
  if (!isAdmin) {
    throw new AppError(Errors.Unauthorized);
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
        `${Errors.InvalidRequirements}: ${requirementsValidationErr}`
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
        chain_id: chain.id,
      },
    });
    if (topics?.length > 0 && topics.length !== topicsToAssociate.length) {
      // did not find all specified topics
      throw new AppError(Errors.InvalidTopics);
    }
  }

  const group = await this.models.Group.findOne({
    where: {
      id: groupId,
      chain_id: chain.id,
    },
  });
  if (!group) {
    throw new AppError(Errors.GroupNotFound);
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

    if (topicsToAssociate && topicsToAssociate.length > 0) {
      // add group to all specified topics
      await this.models.Topic.update(
        {
          group_ids: sequelize.fn(
            'array_append',
            sequelize.col('group_ids'),
            group.id
          ),
        },
        {
          where: {
            id: {
              [Op.in]: topicsToAssociate.map(({ id }) => id),
            },
          },
          transaction,
        }
      );

      // remove group from existing group topics
      await this.models.Topic.update(
        {
          group_ids: sequelize.fn(
            'array_remove',
            sequelize.col('group_ids'),
            group.id
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
        }
      );
    }
  });

  return group.toJSON();
}
