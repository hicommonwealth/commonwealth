import moment from 'moment';
import { FindOptions, Op, Sequelize } from 'sequelize';
import { MEMBERSHIP_REFRESH_TTL_SECONDS } from '../../config';
import { DB } from '../../models';
import { AddressAttributes } from '../../models/address';
import { GroupAttributes } from '../../models/group';
import {
  MembershipAttributes,
  MembershipInstance,
} from '../../models/membership';
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
  const findAllQuery: FindOptions<MembershipAttributes> = {
    where: {
      group_id: {
        [Op.in]: groups.map((g) => g.id),
      },
      address_id: address.id,
    },
    include: [
      {
        model: models.Group,
        as: 'group',
      },
    ],
  };
  const existingMemberships = await models.Membership.findAll(findAllQuery);

  const membershipsToCreate: MembershipAttributes[] = [];
  const membershipsToUpdate: MembershipAttributes[] = [];
  const freshMemberships: MembershipAttributes[] = [];

  for (const group of groups) {
    const membership = existingMemberships.find(
      (m) => m.group_id === group.id && m.address_id === address.id,
    );

    // membership does not exist
    if (!membership) {
      membershipsToCreate.push({
        group_id: group.id,
        address_id: address.id,
        last_checked: null,
      });
      continue;
    }

    // membership exists

    if (!cacheRefresh) {
      const expiresAt = moment(membership.last_checked).add(
        MEMBERSHIP_REFRESH_TTL_SECONDS,
        'seconds',
      );
      if (moment().isBefore(expiresAt)) {
        // membership is fresh
        freshMemberships.push(membership);
        continue;
      }
    }

    // membership is stale
    membershipsToUpdate.push(membership);
  }

  // only fetch balances for groups with stale membership
  const groupsToFetchBalance = groups.filter(
    (g) => !freshMemberships.find((m) => m.group_id === g.id),
  );
  const getBalancesOptions = makeGetBalancesOptions(groupsToFetchBalance, [
    address,
  ]);
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

  const toBulkCreate = [...membershipsToUpdate, ...membershipsToCreate].map(
    (m) =>
      computeMembership(
        groups.find((g) => g.id === m.group_id),
        address,
        balances,
      ),
  );

  await models.Membership.bulkCreate(toBulkCreate, {
    updateOnDuplicate: ['reject_reason', 'last_checked'],
  });

  // must query again to get newly created values after bulkCreate
  return models.Membership.findAll(findAllQuery);
}

/**
 * computeMembership checks the membership against the requirements,
 * updates (or creates) the membership and returns it
 * @param membership The membership to recompute
 * @param group The group of the membership
 * @param address The user address
 * @returns MembershipAttributes
 */
function computeMembership(
  group: GroupAttributes,
  address: AddressAttributes,
  balances: OptionsWithBalances[],
): MembershipAttributes {
  const { requirements } = group;
  const { isValid, messages } = validateGroupMembership(
    address.address,
    requirements,
    balances,
  );
  return {
    group_id: group.id,
    address_id: address.id,
    reject_reason: isValid ? null : messages,
    last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
  };
}
