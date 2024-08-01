import { AppError } from '@hicommonwealth/core';
import { AddressInstance, MembershipRejectReason } from '@hicommonwealth/model';
import { ForumActions } from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { refreshMembershipsForAddress } from '../../util/requirementsModule/refreshMembershipsForAddress';
import { ServerGroupsController } from '../server_groups_controller';

const Errors = {
  TopicNotFound: 'Topic not found',
};

export type RefreshMembershipOptions = {
  address: AddressInstance;
  topicId: number;
};
export type RefreshMembershipResult = {
  topicId?: number;
  allowed: ForumActions[];
  rejectReason?: MembershipRejectReason;
}[];

export async function __refreshMembership(
  this: ServerGroupsController,
  { address, topicId }: RefreshMembershipOptions,
): Promise<RefreshMembershipResult> {
  const groups = await this.models.sequelize.query(
    `
    SELECT G.*, GP.allowed_actions, GP.topic_id FROM "Groups" G
    LEFT JOIN "GroupPermissions" GP ON G.id = GP.group_id 
    WHERE community_id = :communityId AND (:topicId IS NULL OR GP.topic_id = :topicId)
    `,
    {
      type: QueryTypes.SELECT,
      raw: true,
      replacements: {
        communityId: address.community_id,
        topicId: topicId ?? null,
      },
    },
  );

  if (groups.length === 0 && topicId) {
    throw new AppError(Errors.TopicNotFound);
  }

  const memberships = await refreshMembershipsForAddress(
    this.models,
    address,
    groups,
    true, // use fresh balances
  );

  // transform memberships to result shape
  const results = memberships.map((membership) => {
    const specifiedGroup = groups.find((g) => g.id === membership.group_id);

    return {
      groupId: membership.group_id,
      topicIds: groups
        .filter((g) => g.id === membership.group_id)
        .map((g) => g.topic_id),
      allowed: specifiedGroup.allowed_actions,
      rejectReason: membership.reject_reason,
    };
  });

  return results;
}
