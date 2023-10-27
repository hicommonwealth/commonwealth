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
import { ServerGroupsController } from '../server_groups_controller';

const Errors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  GroupNotFound: 'Group not found',
};

export type UpdateGroupOptions = {
  user: UserInstance;
  community: ChainInstance;
  address: AddressInstance;
  groupId: number;
  metadata?: GroupMetadata;
  requirements?: Requirement[];
};

export type UpdateGroupResult = GroupAttributes;

export async function __updateGroup(
  this: ServerGroupsController,
  { user, community, groupId, metadata, requirements }: UpdateGroupOptions
): Promise<UpdateGroupResult> {
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    chainId: community.id,
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

  const group = await this.models.Group.findOne({
    where: {
      id: groupId,
      chain_id: community.id,
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
  });

  return group.toJSON();
}
