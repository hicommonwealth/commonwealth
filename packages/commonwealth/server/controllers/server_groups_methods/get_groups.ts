import {
  GroupAttributes,
  MembershipAttributes,
  TopicAttributes,
} from '@hicommonwealth/model';
import { Op, WhereOptions } from 'sequelize';
import { ServerGroupsController } from '../server_groups_controller';

export type GetGroupsOptions = {
  communityId: string;
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
  { communityId, includeMembers, includeTopics }: GetGroupsOptions,
): Promise<GetGroupsResult> {
  const include = includeTopics
    ? {
        model: this.models.GroupPermission,
        include: {
          model: this.models.Topic,
        },
      }
    : undefined;

  const groups = await this.models.Group.findAll({
    where: {
      community_id: communityId,
    },
    include,
  });

  let groupsResult = groups.map((group) => group.toJSON() as GroupWithExtras);

  if (includeMembers) {
    // optionally include members with groups
    const where: WhereOptions<MembershipAttributes> = {
      group_id: {
        [Op.in]: groupsResult.map(({ id }) => id),
      },
    };
    const members = await this.models.Membership.findAll({
      where,
      include: [
        {
          model: this.models.Address,
          as: 'address',
        },
      ],
    });
    const groupIdMembersMap: Record<number, MembershipAttributes[]> =
      members.reduce((acc, member) => {
        return {
          ...acc,
          [member.group_id]: (acc[member.group_id] || []).concat(member),
        };
      }, {});
    groupsResult = groupsResult.map((group) => ({
      ...group,
      memberships: groupIdMembersMap[group.id] || [],
    }));
  }

  return groupsResult;
}
