import { flatten, uniq } from 'lodash';
import { Op } from 'sequelize';
import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { UserInstance } from '../../models/user';
import { refreshMembershipsForAddress } from '../../util/requirementsModule/refreshMembershipsForAddress';
import { ServerGroupsController } from '../server_groups_controller';

export type RefreshMembershipOptions = {
  user: UserInstance;
  community: ChainInstance;
  address: AddressInstance;
  topicId: number;
};
export type RefreshMembershipResult = {
  topicId?: number;
  allowed: boolean;
  rejectReason?: string;
}[];

export async function __refreshMembership(
  this: ServerGroupsController,
  { community, address, topicId }: RefreshMembershipOptions
): Promise<RefreshMembershipResult> {
  // get all groups across the community topics
  const topics = await this.models.Topic.findAll({
    where: {
      chain_id: community.id,
      ...(topicId ? { id: topicId } : {}),
    },
  });
  const groupIds = uniq(flatten(topics.map(({ group_ids }) => group_ids)));
  const groups = await this.models.Group.findAll({
    where: {
      id: { [Op.in]: groupIds },
    },
  });

  const memberships = await refreshMembershipsForAddress(
    this.models,
    this.tokenBalanceCache,
    address,
    groups
  );

  // transform memberships to result shape
  const results = memberships.map((membership) => {
    const topic = topics.find((t) => t.group_ids.includes(membership.group_id));
    return {
      topicId: topic.id,
      allowed: !membership.reject_reason,
      rejectReason: membership.reject_reason,
    };
  });

  return results;
}
