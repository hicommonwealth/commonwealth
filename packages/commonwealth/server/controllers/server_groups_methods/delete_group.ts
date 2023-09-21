import { ChainInstance } from '../../models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { UserInstance } from '../../models/user';
import { validateOwner } from '../../util/validateOwner';
import { AppError } from '../../../../common-common/src/errors';
import { sequelize } from '../../../../chain-events/services/database/database';

const Errors = {
  Unauthorized: 'Unauthorized',
  GroupNotFound: 'Group not found',
};

export type DeleteGroupOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  groupId: number;
};

export type DeleteGroupResult = void;

export async function __deleteGroup(
  this: ServerChainsController,
  { user, chain, groupId }: DeleteGroupOptions
): Promise<DeleteGroupResult> {
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

  const group = await this.models.Group.findOne({
    where: {
      id: groupId,
      chain_id: chain.id,
    },
  });
  if (!group) {
    throw new AppError(Errors.GroupNotFound);
  }

  await sequelize.transaction(async (transaction) => {
    // delete all membership of group
    await this.models.Membership.destroy({
      where: {
        group_id: group.id,
      },
      transaction,
    });
    // delete group
    await this.models.Group.destroy({
      where: {
        id: group.id,
      },
    });
  });
}
