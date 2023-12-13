import moment from 'moment';
import { Sequelize } from 'sequelize';
import { MEMBERSHIP_REFRESH_TTL_SECONDS } from '../../config';
import { DB } from '../../models';
import { AddressAttributes } from '../../models/address';
import { GroupAttributes } from '../../models/group';
import { MembershipInstance } from '../../models/membership';
import { TokenBalanceCache } from '../tokenBalanceCache/tokenBalanceCache';
import { OptionsWithBalances } from '../tokenBalanceCache/types';
import { makeGetBalancesOptions } from './makeGetBalancesOptions';
import validateGroupMembership from './validateGroupMembership';

/**
 * refreshMembershipsForAddress refreshes the memberships for the given address
 * @param address Address associated with memberships
 * @param groups Groups to check requirements from
 * @param topics Topics associated with groups
 * @param cacheRefresh if true, forces TBC cache to refresh and force updates membership
 * @returns MembershipInstance[]
 */
export async function refreshMembershipsForAddress(
  models: DB,
  tokenBalanceCache: TokenBalanceCache,
  address: AddressAttributes,
  groups: GroupAttributes[],
  cacheRefresh: boolean,
): Promise<MembershipInstance[]> {
  const getBalancesOptions = makeGetBalancesOptions(groups, [address]);
  const balances = await Promise.all(
    getBalancesOptions.map(async (options) => {
      return {
        options,
        balances: await tokenBalanceCache.getBalances({
          ...options,
          cacheRefresh,
        }),
      };
    }),
  );

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

      if (!cacheRefresh && membership) {
        // membership exists
        const expiresAt = moment(membership.last_checked).add(
          MEMBERSHIP_REFRESH_TTL_SECONDS,
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
          balances,
        );
      }

      // membership does not exist, create it and recompute
      return recomputeMembership(models, membership, group, address, balances);
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
  address: AddressAttributes,
  balances: OptionsWithBalances[],
): Promise<MembershipInstance> {
  const { requirements } = group;
  const { isValid, messages } = await validateGroupMembership(
    address.address,
    requirements,
    balances,
  );
  const computedMembership = {
    group_id: group.id,
    address_id: address.id,
    reject_reason: isValid ? null : messages,
    last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
  };
  if (!membership) {
    return models.Membership.create(computedMembership);
  }
  return membership.update(computedMembership);
}
