import { AppError } from '@hicommonwealth/adapters';
import {
  AddressInstance,
  CommunityInstance,
  UserInstance,
  sequelize,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { validateOwner } from '../../util/validateOwner';
import { ServerCommunitiesController } from '../server_communities_controller';

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
  this: ServerCommunitiesController,
  { user, community, groupId }: DeleteGroupOptions,
): Promise<DeleteGroupResult> {
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

  const group = await this.models.Group.findOne({
    where: {
      id: groupId,
      community_id: community.id,
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
