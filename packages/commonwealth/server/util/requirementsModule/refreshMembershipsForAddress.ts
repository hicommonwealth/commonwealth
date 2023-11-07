import moment from 'moment';
import { Sequelize } from 'sequelize';
import { DB } from 'server/models';
import { TokenBalanceCache } from '../../../../token-balance-cache/src';
import { AddressInstance } from '../../models/address';
import { GroupAttributes } from '../../models/group';
import { MembershipInstance } from '../../models/membership';
import validateGroupMembership from './validateGroupMembership';

const MEMBERSHIP_TTL_SECONDS = 60 * 2;

/**
 * refreshMembershipsForAddress refreshes the memberships for the given address
 * @param address Address associated with memberships
 * @param groups Groups to check requirements from
 * @param topics Topics associated with groups
 * @returns MembershipInstance[]
 */
export async function refreshMembershipsForAddress(
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  address: AddressInstance,
  groups: GroupAttributes[],
): Promise<MembershipInstance[]> {
  // update membership for each group
  const updatedMemberships = await Promise.all(
    groups.map(async (group) => {
      const membership = await models.Membership.findOne({
        where: {
          group_id: group.id,
          address_id: address.id,
        },
        include: [
          {
            model: models.Group,
            as: 'group',
          },
        ],
      });

      if (membership) {
        // membership exists
        const expiresAt = moment(membership.last_checked).add(
          MEMBERSHIP_TTL_SECONDS,
          'seconds',
        );
        if (moment().isBefore(expiresAt)) {
          // membership is fresh, don't recompute
          return membership;
        }
        // membership is stale, recompute
        return recomputeMembership(
          models,
          membership,
          group,
          address,
          tokenBalanceCache,
        );
      }

      // membership does not exist, create it and recompute
      return recomputeMembership(
        models,
        membership,
        group,
        address,
        tokenBalanceCache,
      );
    }),
  );

  return updatedMemberships;
}

/**
 * recomputeMembership checks the membership against the requirements,
 * updates (or creates) the membership and returns it
 * @param membership The membership to recompute
 * @param group The group of the membership
 * @param address The user address
 * @returns MembershipInstance
 */
async function recomputeMembership(
  models: DB,
  membership: MembershipInstance | null,
  group: GroupAttributes,
  address: AddressInstance,
  tokenBalanceCache: TokenBalanceCache,
): Promise<MembershipInstance> {
  const { requirements } = group;
  const { isValid, messages } = await validateGroupMembership(
    address.address,
    requirements,
    tokenBalanceCache,
  );
  const computedMembership = {
    group_id: group.id,
    address_id: address.id,
    reject_reason: isValid ? null : JSON.stringify(messages),
    last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
  };
  if (!membership) {
    return models.Membership.create(computedMembership);
  }
  return membership.update(computedMembership);
}
