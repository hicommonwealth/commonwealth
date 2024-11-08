import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import type { Requirement } from '@hicommonwealth/shared';
import moment from 'moment';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustBeAuthorized } from '../middleware/guards';
import type {
  AddressAttributes,
  GroupAttributes,
  MembershipRejectReason,
} from '../models';
import {
  tokenBalanceCache,
  type Balances,
  type OptionsWithBalances,
} from '../services';
import { makeGetBalancesOptions, validateGroupMembership } from '../utils';

const log = logger(import.meta);

type ComputedMembership = {
  group_id: number;
  address_id: number;
  reject_reason: MembershipRejectReason | null;
  last_checked: Date;
};

function computeMembership(
  address: AddressAttributes,
  group: GroupAttributes,
  balances: OptionsWithBalances[],
): ComputedMembership {
  const { requirements } = group;
  const { isValid, messages } = validateGroupMembership(
    address.address,
    requirements as Requirement[],
    balances,
    group.metadata.required_requirements!,
  );
  return {
    group_id: group.id!,
    address_id: address.id!,
    reject_reason: isValid ? null : (messages ?? null),
    last_checked: new Date(),
  };
}

// upserts memberships for each combination of address and group
async function processMemberships(
  groups: GroupAttributes[],
  addresses: AddressAttributes[],
  balances: OptionsWithBalances[],
): Promise<[number, number]> {
  const toCreate = [];
  const toUpdate = [];
  for (const group of groups) {
    for (const address of addresses) {
      const memberships = address.Memberships ?? [];
      const found = memberships.find(({ group_id }) => group_id === group.id);
      if (found) {
        const expiresAt = moment(found.last_checked).add(
          config.MEMBERSHIP_REFRESH_TTL_SECONDS,
          'seconds',
        );
        if (moment().isAfter(expiresAt)) {
          const updated = computeMembership(address, group, balances);
          toUpdate.push(updated);
        }
      } else {
        // membership does not exist, create
        const created = computeMembership(address, group, balances);
        toCreate.push(created);
      }
    }
  }
  await models.Membership.bulkCreate([...toCreate, ...toUpdate], {
    updateOnDuplicate: ['reject_reason', 'last_checked'],
  });
  return [toCreate.length, toUpdate.length];
}

// paginates through all active addresses within the community
async function paginateAddresses(
  community_id: string,
  minAddressId: number,
  callback: (addresses: AddressAttributes[]) => Promise<void>,
): Promise<void> {
  const addresses = await models.Address.findAll({
    where: {
      community_id,
      verified: { [Op.ne]: null },
      id: { [Op.gt]: minAddressId },
    },
    attributes: ['id', 'address'],
    include: {
      model: models.Membership,
      as: 'Memberships',
      required: false,
    },
    order: [['id', 'ASC']],
    limit: config.MEMBERSHIP_REFRESH_BATCH_SIZE,
  });

  if (addresses.length === 0) {
    return;
  }

  await callback(addresses);

  if (addresses.length < config.MEMBERSHIP_REFRESH_BATCH_SIZE) return;

  return paginateAddresses(
    community_id,
    addresses[addresses.length - 1].id!,
    callback,
  );
}

// TODO: This can be a long running process, let's think about refactoring into a process manager (policy) that calls
// this command as RefreshCommunityMembershipsBatch, keeping track of position in the refresh process
export function RefreshCommunityMemberships(): Command<
  typeof schemas.RefreshCommunityMemberships
> {
  return {
    ...schemas.RefreshCommunityMemberships,
    auth: [authRoles('admin')],
    body: async ({ actor, payload, auth }) => {
      const { community_id } = mustBeAuthorized(actor, auth);
      const { group_id } = payload;

      const groups = await models.Group.findAll({
        where: group_id ? { id: group_id, community_id } : { community_id },
      });
      log.info(
        `Paginating addresses in ${groups.length} groups in ${community_id}...`,
      );

      const communityStartedAt = Date.now();
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalAddresses = 0;

      await paginateAddresses(community_id, 0, async (addresses) => {
        const pageStartedAt = Date.now();

        const getBalancesOptions = makeGetBalancesOptions(
          groups,
          addresses.map((a) => a.address),
        );
        const balances = await Promise.all(
          getBalancesOptions.map(async (options) => {
            let result: Balances = {};
            try {
              result = await tokenBalanceCache.getBalances({
                ...options,
                cacheRefresh: false, // get cached balances
              });
            } catch (err) {
              console.error(err);
            }
            return {
              options,
              balances: result,
            };
          }),
        );

        const [created, updated] = await processMemberships(
          groups,
          addresses,
          balances,
        );

        totalCreated += created;
        totalUpdated += updated;
        totalAddresses += addresses.length;

        log.info(
          `Created ${created} and updated ${updated} memberships in ${community_id} across ${
            addresses.length
          } addresses in ${(Date.now() - pageStartedAt) / 1000}s`,
        );
      });

      log.info(
        `Created ${totalCreated} and updated ${totalUpdated} total memberships in ${
          community_id
        } across ${totalAddresses} addresses in ${
          (Date.now() - communityStartedAt) / 1000
        }s`,
      );

      return { community_id, created: totalCreated, updated: totalUpdated };
    },
  };
}
