import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  MembershipRejectReason,
  UserInstance,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { refreshMembershipsForAddress } from '../../util/requirementsModule/refreshMembershipsForAddress';
import { ServerGroupsController } from '../server_groups_controller';

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
  });

  console.log('groups are', groups);

  // optionally filter to only groups associated with topic
  if (topicId) {
    console.log('topicId found');
    const topic = await this.models.Topic.findByPk(topicId);
    console.log('topic found', topicId, topic);
    if (!topic) {
      throw new AppError(Errors.TopicNotFound);
    }
    // @ts-expect-error StrictNullChecks
    groups = groups.filter((g) => topic.group_ids.includes(g.id));
    console.log('groups found', groups);
  }

  console.log('memberships start');
  const memberships = await refreshMembershipsForAddress(
    this.models,
    address,
    groups,
    true, // use fresh balances
  );
  console.log('memberships found', memberships);

  console.log('topic start');
  const topics = await this.models.Topic.findAll({
    where: {
      group_ids: {
        [Op.overlap]: groups.map((g) => g.id!),
      },
    },
    attributes: ['id', 'group_ids'],
  });
  console.log('topic found2', topics);

  // transform memberships to result shape
  const results = memberships.map((membership) => ({
    groupId: membership.group_id,
    topicIds: topics
      .filter((t) => t.group_ids!.includes(membership.group_id))
      .map((t) => t.id),
    allowed: !membership.reject_reason,
    rejectReason: membership.reject_reason,
  }));
  console.log('results found2', results);

  return results;
}
