import { Op } from 'sequelize';
import { GroupAttributes } from 'server/models/group';
import { MembershipAttributes } from 'server/models/membership';
import { TopicAttributes } from 'server/models/topic';
import { CommunityInstance } from '../../models/community';
import { ServerGroupsController } from '../server_groups_controller';

export type GetGroupsOptions = {
  community: CommunityInstance;
  includeMembers?: boolean;
  includeTopics?: boolean;
};

type GroupWithExtras = GroupAttributes & {
  memberships?: MembershipAttributes[];
  topics?: TopicAttributes[];
};
export type GetGroupsResult = GroupWithExtras[];

export async function __getGroups(
  this: ServerGroupsController,
  { community, includeTopics }: GetGroupsOptions,
): Promise<GetGroupsResult> {
  const groups = await this.models.Group.findAll({
    where: {
      community_id: community.id,
    },
  });

  let groupsResult = groups.map((group) => group.toJSON() as GroupWithExtras);

  if (includeTopics) {
    const topics = await this.models.Topic.findAll({
      where: {
        chain_id: community.id,
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
