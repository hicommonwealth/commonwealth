import { AppError } from '@hicommonwealth/core/src/index';
import {
  AddressInstance,
  MembershipRejectReason,
  UserInstance,
} from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
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
  // get all groups in the community with the topic_ids if the topicId is passed in
  const groups = await this.models.sequelize.query(
    `
    SELECT G.* FROM "Groups" G
    LEFT JOIN "GroupPermissions" GP ON :topicId IS NOT NULL AND G.id = GP.group_id 
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
  const results = memberships.map((membership) => ({
    groupId: membership.group_id,
    topicIds: groups
      // @ts-expect-error StrictNullChecks
      .filter((g) => g.group_id === membership.group_id)
      .map((g) => g.topic_id)
      .map((t) => t.id),
    allowed: !membership.reject_reason,
    rejectReason: membership.reject_reason,
  }));

  return results;
}
