import { Op } from 'sequelize';
import { ChainInstance } from 'server/models/chain';
import { GroupAttributes } from 'server/models/group';
import { MembershipAttributes } from 'server/models/membership';
import { TopicAttributes } from 'server/models/topic';
import { ServerGroupsController } from '../server_groups_controller';

export type GetGroupsOptions = {
  chain: ChainInstance;
  includeTopics?: boolean;
  addressId?: number;
};

type GroupWithExtras = GroupAttributes & {
  memberships?: MembershipAttributes[];
  topics?: TopicAttributes[];
};
export type GetGroupsResult = GroupWithExtras[];

export async function __getGroups(
  this: ServerGroupsController,
  { chain, addressId, includeTopics }: GetGroupsOptions
): Promise<GetGroupsResult> {
  const groups = await this.models.Group.findAll({
    where: {
      chain_id: chain.id,
    },
  });

  let groupsResult = groups.map((group) => group.toJSON() as GroupWithExtras);

  if (includeTopics) {
    const topics = await this.models.Topic.findAll({
      where: {
        chain_id: chain.id,
        group_ids: {
          [Op.overlap]: groupsResult.map(({ id }) => id),
        },
      },
    });
    groupsResult = groupsResult.map((group) => ({
      ...group,
      topics: topics
        .map((t) => t.toJSON())
        .filter((t) => t.group_ids.includes(group.id)),
    }));
  }

  return groupsResult;
}
