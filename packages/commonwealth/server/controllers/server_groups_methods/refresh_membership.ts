import { ServerCommunitiesController } from '../server_communities_controller';
import { CommunityInstance } from '../../models/community';
import { AddressInstance } from '../../models/address';
import { UserInstance } from '../../models/user';
import { Op, Sequelize } from 'sequelize';
import validateGroupMembership from '../../util/requirementsModule/validateGroupMembership';
import moment from 'moment';
import { MembershipInstance } from '../../models/membership';
import { flatten, uniq } from 'lodash';
import { ServerError } from '../../../../common-common/src/errors';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';

const MEMBERSHIP_TTL_SECONDS = 60 * 2;

export type RefreshMembershipOptions = {
  user: UserInstance;
  chain: CommunityInstance;
  address: AddressInstance;
  topicId: number;
};
export type RefreshMembershipResult = {
  topicId?: number;
  allowed: boolean;
  rejectReason?: string;
}[];

export async function __refreshMembership(
  this: ServerCommunitiesController,
  { chain, address, topicId }: RefreshMembershipOptions
): Promise<RefreshMembershipResult> {
  // get all groups across the chain topics
  const chainTopics = await this.models.Topic.findAll({
    where: {
      chain_id: chain.id,
      ...(topicId ? { id: topicId } : {}),
    },
  });
  const groupIds = uniq(flatten(chainTopics.map(({ group_ids }) => group_ids)));
  const groups = await this.models.Group.findAll({
    where: {
      id: { [Op.in]: groupIds },
    },
  });

  // update membership for each group
  const updatedMemberships = await Promise.all(
    groups.map(async (group) => {
      const [membership, created] = await this.models.Membership.findOrCreate({
        where: {
          group_id: group.id,
          address_id: address.id,
        },
        defaults: {
          group_id: group.id,
          address_id: address.id,
          reject_reason: null,
          last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
        },
        include: [{
          model: this.models.Group,
          as: 'group'
        }]
      });
      membership.group = group;

      if (!created) {
        const expiresAt = moment(membership.last_checked).add(
          MEMBERSHIP_TTL_SECONDS,
          'seconds'
        );
        if (moment().isBefore(expiresAt)) {
          // already exists and is fresh, don't recompute
          return membership;
        }
      }

      // is newly created or stale, recompute
      return recomputeMembership(membership, address, this.tokenBalanceCache);
    })
  );

  // transform memberships to result shape
  const results = updatedMemberships.map((membership) => {
    const topic = chainTopics.find((t) =>
      t.group_ids.includes(membership.group_id)
    );
    return {
      topicId: topic.id,
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
  address: AddressInstance,
  tokenBalanceCache: TokenBalanceCache
): Promise<MembershipInstance> {
  if (!membership.group) {
    throw new ServerError('membership Group is not populated');
  }
  const { requirements } = membership.group;
  const { isValid, messages } = await validateGroupMembership(
    address.address,
    requirements,
    tokenBalanceCache
  );
  return membership.update({
    reject_reason: isValid ? null : JSON.stringify(messages),
    last_checked: Sequelize.literal('CURRENT_TIMESTAMP'),
  });
}
