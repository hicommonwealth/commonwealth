import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  MembershipRejectReason,
  UserInstance,
} from '@hicommonwealth/model';
import { GroupTopicPermissionEnum } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { refreshMembershipsForAddress } from '../../util/requirementsModule/refreshMembershipsForAddress';
import { ServerGroupsController } from '../server_groups_controller';
import { GroupInstanceWithTopicPermissions } from './get_groups';

const Errors = {
  TopicNotFound: 'Topic not found',
};

export type RefreshMembershipOptions = {
  user: UserInstance;
  address: AddressInstance;
  topicId: number;
};
export type RefreshMembershipResult = {
  topicId?: number;
  allowed: boolean;
  rejectReason?: MembershipRejectReason;
}[];

export async function __refreshMembership(
  this: ServerGroupsController,
  { address, topicId }: RefreshMembershipOptions,
): Promise<RefreshMembershipResult> {
  // get all groups in the community
  let groups = await this.models.Group.findAll({
    where: {
      community_id: address.community_id,
    },
    include: [
      {
        model: this.models.GroupTopicPermission,
        attributes: ['topic_id', 'allowed_actions'],
      },
    ],
  });

  // optionally filter to only groups associated with topic
  if (topicId) {
    const topic = await this.models.Topic.findByPk(topicId);
    if (!topic) {
      throw new AppError(Errors.TopicNotFound);
    }
    // @ts-expect-error StrictNullChecks
    groups = groups.filter((g) => topic.group_ids.includes(g.id));
  }

  const memberships = await refreshMembershipsForAddress(
    this.models,
    address,
    groups,
    true, // use fresh balances
  );

  const topics = await this.models.Topic.findAll({
    where: {
      group_ids: {
        [Op.overlap]: groups.map((g) => g.id!),
      },
    },
    attributes: ['id', 'group_ids'],
  });

  // transform memberships to result shape
  const results = memberships.map((membership) => ({
    groupId: membership.group_id,
    topics: topics
      .filter((t) => t.group_ids!.includes(membership.group_id))
      .map((t) => ({
        id: t.id,
        permission:
          (groups as GroupInstanceWithTopicPermissions[])
            .find((g) => g.id === membership.group_id)
            ?.GroupTopicPermissions?.find((gtp) => gtp.topic_id === t.id)
            ?.allowed_actions ||
          // TODO: this fallback should be via a migration for existing communities
          GroupTopicPermissionEnum.UPVOTE_AND_COMMENT_AND_POST,
      })),
    allowed: !membership.reject_reason,
    rejectReason: membership.reject_reason,
  }));

  return results;
}
