import { Op } from 'sequelize';
import { AppError } from '../../../../common-common/src/errors';
import { sequelize } from '../../database';
import { AddressInstance } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { UserInstance } from '../../models/user';
import { validateOwner } from '../../util/validateOwner';
import { ServerGroupsController } from '../server_groups_controller';

const Errors = {
  Unauthorized: 'Unauthorized',
  GroupNotFound: 'Group not found',
};

export type DeleteGroupOptions = {
  user: UserInstance;
  community: CommunityInstance;
  address: AddressInstance;
  groupId: number;
};

export type DeleteGroupResult = void;

export async function __deleteGroup(
  this: ServerGroupsController,
  { user, community, groupId }: DeleteGroupOptions
): Promise<DeleteGroupResult> {
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

  const group = await this.models.Group.findOne({
    where: {
      id: groupId,
      chain_id: community.id,
    },
  });
  if (!group) {
    throw new AppError(Errors.GroupNotFound);
  }

  await this.models.sequelize.transaction(async (transaction) => {
    // remove group from all associated topics
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
          group_ids: {
            [Op.contains]: [group.id],
          },
        },
        transaction,
      }
    );
    // delete all memberships of group
    await this.models.Membership.destroy({
      where: {
        group_id: group.id,
      },
    });
    // delete group
    await this.models.Group.destroy({
      where: {
        id: group.id,
      },
      transaction,
    });
  });
}
