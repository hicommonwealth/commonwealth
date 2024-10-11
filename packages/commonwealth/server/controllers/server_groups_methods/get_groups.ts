import {
  GroupAttributes,
  GroupInstance,
  MembershipAttributes,
  TopicAttributes,
} from '@hicommonwealth/model';
import { GroupTopicPermissionEnum } from '@hicommonwealth/schemas';
import { Op, WhereOptions } from 'sequelize';
import { ServerGroupsController } from '../server_groups_controller';

export type GetGroupsOptions = {
  communityId: string;
  includeMembers?: boolean;
  includeTopics?: boolean;
};

export type TopicAttributesWithPermission = TopicAttributes & {
  permission: GroupTopicPermissionEnum;
};

type GroupWithExtras = GroupAttributes & {
  memberships?: MembershipAttributes[];
  topics?: TopicAttributesWithPermission[];
};
export type GetGroupsResult = GroupWithExtras[];

export type GroupInstanceWithTopicPermissions = GroupInstance & {
  GroupTopicPermissions: {
    topic_id: number;
    allowed_actions: GroupTopicPermissionEnum;
  }[];
};

export async function __getGroups(
  this: ServerGroupsController,
  { communityId, includeMembers, includeTopics }: GetGroupsOptions,
): Promise<GetGroupsResult> {
  const groups = await this.models.Group.findAll({
    where: {
      community_id: communityId,
    },
    include: [
      {
        model: this.models.GroupTopicPermission,
        attributes: ['topic_id', 'allowed_actions'],
      },
    ],
  });

  let groupsResult = groups.map((group) => group.toJSON() as GroupWithExtras);

  if (includeMembers) {
    // optionally include members with groups
    const where: WhereOptions<MembershipAttributes> = {
      group_id: {
        [Op.in]: groupsResult.map(({ id }) => id!),
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
      memberships: groupIdMembersMap[group.id!] || [],
    }));
  }

  if (includeTopics) {
    const topics = await this.models.Topic.findAll({
      where: {
        community_id: communityId,
        group_ids: {
          [Op.overlap]: groupsResult.map(({ id }) => id!),
        },
      },
    });

    groupsResult = groupsResult.map((group) => ({
      ...group,
      topics: topics
        .filter((t) => t.group_ids!.includes(group.id!))
        .map((t) => {
          const temp: TopicAttributesWithPermission = { ...t.toJSON() };
          temp.permission = (
            (group as GroupInstanceWithTopicPermissions)
              .GroupTopicPermissions || []
          ).find((gtp) => gtp.topic_id === t.id)
            ?.allowed_actions as GroupTopicPermissionEnum;
          return temp;
        }),
    }));
  }

  return groupsResult;
}
