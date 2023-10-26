import moment from 'moment';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
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
  groups: GroupAttributes[]
): Promise<MembershipInstance[]> {
  // update membership for each group
  const updatedMemberships = await Promise.all(
    groups.map(async (group) => {
      const [membership, created] = await models.Membership.findOrCreate({
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
        include: [
          {
            model: models.Group,
            as: 'group',
          },
        ],
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
      return recomputeMembership(membership, address, tokenBalanceCache);
    })
  );

  return updatedMemberships;
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
