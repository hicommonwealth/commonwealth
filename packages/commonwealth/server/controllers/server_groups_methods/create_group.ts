import { ChainInstance } from '../../models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import { UserInstance } from '../../models/user';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { AppError } from '../../../../common-common/src/errors';
import { validateOwner } from '../../util/validateOwner';
import { GroupAttributes, GroupMetadata } from '../../models/group';
import { Op } from 'sequelize';
import { sequelize } from '../../database';
import validateMetadata from '../../util/requirementsModule/validateMetadata';

const MAX_GROUPS_PER_CHAIN = 20;

const Errors = {
  InvalidMetadata: 'Invalid requirements',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  MaxGroups: 'Exceeded max number of groups',
  InvalidTopics: 'Invalid topics',
};

export type CreateGroupOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  metadata: GroupMetadata;
  requirements: Requirement[];
  topics?: number[];
};

export type CreateGroupResult = GroupAttributes;

export async function __createGroup(
  this: ServerChainsController,
  { user, chain, metadata, requirements, topics }: CreateGroupOptions
): Promise<CreateGroupResult> {
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

  const metadataValidationErr = validateMetadata(metadata);
  if (metadataValidationErr) {
    throw new AppError(`${Errors.InvalidMetadata}: ${metadataValidationErr}`);
  }

  if (!validateRequirements(requirements)) {
    throw new AppError(Errors.InvalidRequirements);
  }

  const numChainGroups = await this.models.Group.count({
    where: {
      chain_id: chain.id,
    },
  });
  if (numChainGroups >= MAX_GROUPS_PER_CHAIN) {
    throw new AppError(Errors.MaxGroups);
  }

  const topicsToAssociate = await this.models.Topic.findAll({
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

  const newGroup = await this.models.sequelize.transaction(
    async (transaction) => {
      // create group
      const group = await this.models.Group.create(
        {
          chain_id: chain.id,
          metadata,
          requirements,
        },
        { transaction }
      );
      if (topicsToAssociate.length > 0) {
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
      }
      return group.toJSON();
    }
  );

  return newGroup;
}
