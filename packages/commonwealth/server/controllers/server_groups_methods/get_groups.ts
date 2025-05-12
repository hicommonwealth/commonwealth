import { AppError } from '@hicommonwealth/core';
import {
  GroupAttributes,
  MembershipAttributes,
  TopicAttributes,
} from '@hicommonwealth/model';
import { GatedActionEnum } from '@hicommonwealth/schemas';
import { Op, WhereOptions } from 'sequelize';
import { ServerGroupsController } from '../server_groups_controller';

export type GetGroupsOptions = {
  includeMembers?: boolean;
  includeTopics?: boolean;
} & (
  | {
      communityId: string;
      groupId?: never;
    }
  | {
      communityId?: never;
      groupId: number;
    }
);

const Errors = {
  InvalidGroup: 'Invalid group',
  InvalidCommunity: 'Invalid community',
};

export type TopicAttributesWithPermission = TopicAttributes & {
  permissions: GatedActionEnum[];
};

type GroupWithExtras = GroupAttributes & {
  memberships?: MembershipAttributes[];
  topics?: TopicAttributesWithPermission[];
};
export type GetGroupsResult = GroupWithExtras[];

export async function __getGroups(
  this: ServerGroupsController,
  { communityId, groupId, includeMembers, includeTopics }: GetGroupsOptions,
): Promise<GetGroupsResult> {
  if (communityId) {
    const foundCommunity = await this.models.Community.findOne({
      where: { id: communityId },
    });
    if (!foundCommunity) throw new AppError(Errors.InvalidCommunity);
  }
  if (groupId) {
    const foundGroup = await this.models.Group.findOne({
      where: { id: groupId },
    });
    if (!foundGroup) throw new AppError(Errors.InvalidGroup);
  }

  const groups = await this.models.Group.findAll({
    where: {
      ...(communityId && { community_id: communityId }),
      ...(groupId && { id: groupId }),
    },
    include: [
      {
        model: this.models.GroupGatedAction,
        attributes: ['topic_id', 'gated_actions'],
      },
    ],
  });

  let groupsResult = groups.map((group) => group.toJSON());

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
        ...(communityId && { community_id: communityId }),
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
          temp.permissions = (group.GroupGatedActions || []).find(
            (gtp) => gtp.topic_id === t.id,
          )?.gated_actions as GatedActionEnum[];
          return temp;
        }),
    }));
  }

  return groupsResult;
}
