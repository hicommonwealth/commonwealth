import { ChainInstance } from '../../models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { Requirement } from '../../util/requirementsModule/requirementsTypes';
import { UserInstance } from '../../models/user';
import validateRequirements from '../../util/requirementsModule/validateRequirements';
import { AppError } from '../../../../common-common/src/errors';
import { validateOwner } from '../../util/validateOwner';
import validateMetadata from '../../util/requirementsModule/validateMetadata';
import { GroupAttributes, GroupMetadata } from '../../models/group';
import { sequelize } from '../../../../chain-events/services/database/database';

const Errors = {
  InvalidMetadata: 'Invalid metadata',
  InvalidRequirements: 'Invalid requirements',
  Unauthorized: 'Unauthorized',
  GroupNotFound: 'Group not found',
};

export type UpdateGroupOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  groupId: number;
  metadata?: GroupMetadata;
  requirements?: Requirement[];
};

export type UpdateGroupResult = GroupAttributes;

export async function __updateGroup(
  this: ServerChainsController,
  { user, chain, groupId, metadata, requirements }: UpdateGroupOptions
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

  if (metadata) {
    const metadataValidationErr = validateMetadata(metadata);
    if (metadataValidationErr) {
      throw new AppError(`${Errors.InvalidMetadata}: ${metadataValidationErr}`);
    }
  }

  if (requirements && !validateRequirements(requirements)) {
    throw new AppError(Errors.InvalidRequirements);
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
    // delete all existing memberships for group
    await this.models.Membership.destroy({
      where: {
        group_id: group.id,
      },
      transaction,
    });
    // update group
    await group.update(toUpdate, { transaction });
  });

  return group.toJSON();
}
