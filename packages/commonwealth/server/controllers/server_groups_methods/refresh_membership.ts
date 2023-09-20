import { ChainInstance } from 'server/models/chain';
import { ServerChainsController } from '../server_chains_controller';
import { AddressInstance } from '../../models/address';
import { UserInstance } from '../../models/user';
import { Op, Sequelize, WhereOptions } from 'sequelize';
import { TopicAttributes } from 'server/models/topic';
import validateGroupMembership from 'server/util/requirementsModule/validateGroupMembership';
import moment from 'moment';
import { MembershipInstance } from 'server/models/membership';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { flatten, uniq } from 'lodash';

const MEMBERSHIP_TTL_SECONDS = 60 * 2;

export type RefreshMembershipOptions = {
  user: UserInstance;
  chain: ChainInstance;
  address: AddressInstance;
  topicId: number;
};
export type RefreshMembershipResult = {
  topicId?: number;
  allowed: boolean;
  rejectReason?: string;
}[];

export async function __refreshMembership(
  this: ServerChainsController,
  { user, chain, address, topicId }: RefreshMembershipOptions
): Promise<RefreshMembershipResult> {
  // get all memberships for user address
  const topicWhere: WhereOptions<TopicAttributes> = {
    chain_id: chain.id,
  };
  if (topicId) {
    topicWhere.id = topicId;
  }
  const chainTopics = await this.models.Topic.findAll({
    where: topicWhere,
  });
  const memberships = await this.models.Membership.findAll({
    where: {
      group_id: {
        [Op.in]: chainTopics.map(({ id }) => id),
      },
      address_id: address.id,
    },
    include: [
      {
        model: this.models.Group,
        as: 'Group',
      },
    ],
  });

  // refresh stale memberships
  const refreshedMemberships = await Promise.all(
    memberships.map(async (membership) => {
      const expiresAt = moment(membership.last_checked).add(
        MEMBERSHIP_TTL_SECONDS,
        'seconds'
      );
      if (moment().isBefore(expiresAt)) {
        // is fresh, skip
        return membership;
      }
      // is stale, recompute
      return recomputeMembership(membership, address);
    })
  );

  // create missing memberships across chain topics
  const groupIds = uniq(flatten(chainTopics.map(({ group_ids }) => group_ids)));
  const groups = await this.models.Group.findAll({
    where: {
      id: { [Op.in]: groupIds },
    },
  });
  const createdMemberships = await Promise.all(
    groups.map(async (group) => {
      const hasGroupMembership = !!memberships.find(
        (m) => m.group_id === group.id
      );
      if (!hasGroupMembership) {
        const membership = await this.models.Membership.create({
          group_id: group.id,
          address_id: address.id,
          reject_reason: null,
          last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
        });
        membership.Group = group;
        return recomputeMembership(membership, address);
      }
    })
  );

  // transform memberships to result shape
  const combinedResults = [...refreshedMemberships, ...createdMemberships];
  const results = combinedResults.map((membership) => {
    const group = chainTopics.find((topic) =>
      topic.group_ids.includes(membership.group_id)
    );
    return {
      topicId: group.id,
      allowed: !membership.reject_reason,
      rejectReason: membership.reject_reason,
    };
  });

  return results;
}

/**
 * recomputeMembership checks the membership against the requirements,
 * updates the membership status and returns it
 * @param membership The membership to recompute
 * @param address The user address
 * @returns MembershipInstance
 */
async function recomputeMembership(
  membership: MembershipInstance,
  address: AddressInstance
): Promise<MembershipInstance> {
  if (!membership.Group) {
    throw new ServerError('membership Group is not populated');
  }
  const { requirements } = membership.Group;
  const { isValid, messages } = validateGroupMembership(
    address.address,
    requirements,
    this.tokenBalanceCache
  );
  return membership.update({
    reject_reason: isValid ? null : JSON.stringify(messages),
    last_checked: Sequelize.literal('CURRENT_TIMESTAMP'),
  });
}
