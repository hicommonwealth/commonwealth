import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  UserInstance,
  sequelize,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { validateOwner } from '../../util/validateOwner';
import { ServerCommunitiesController } from '../server_communities_controller';

const Errors = {
  Unauthorized: 'Unauthorized',
  GroupNotFound: 'Group not found',
  SystemManaged: 'Cannot update group that is system-managed',
};

export type DeleteGroupOptions = {
  user: UserInstance;
  address: AddressInstance;
  groupId: number;
};

export type DeleteGroupResult = void;

export async function __deleteGroup(
  this: ServerCommunitiesController,
  { user, groupId }: DeleteGroupOptions,
): Promise<DeleteGroupResult> {
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

  await this.models.sequelize.transaction(async (transaction) => {
    // remove group from all associated topics
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
          group_ids: {
            [Op.contains]: [group.id],
          },
        },
        transaction,
      },
    );
    // delete all memberships of group
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
      transaction,
    });
  });
}
