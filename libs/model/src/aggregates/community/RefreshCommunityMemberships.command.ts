import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import type { Requirement } from '@hicommonwealth/shared';
import moment from 'moment';
import { Op } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import type { AddressAttributes, GroupAttributes } from '../../models';
import {
  tokenBalanceCache,
  type Balances,
  type OptionsWithBalances,
} from '../../services';
import {
  emitEvent,
  makeGetBalancesOptions,
  validateGroupMembership,
} from '../../utils';

const log = logger(import.meta);

type Membership = z.infer<typeof schemas.Membership>;

function computeMembership(
  address: AddressAttributes,
  group: GroupAttributes,
  balances: OptionsWithBalances[],
): Membership {
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
    reject_reason: isValid ? undefined : (messages ?? undefined),
    last_checked: new Date(),
  };
}

// upserts memberships for each combination of address and group
async function processMemberships(
  community_id: string,
  groups: GroupAttributes[],
  addresses: AddressAttributes[],
  balances: OptionsWithBalances[],
  force_refresh = false,
): Promise<[number, number, number]> {
  const toCreate = [] as Membership[];
  const toUpdate = [] as Membership[];
  const toEmit = [] as Array<{
    group_id: number;
    address_id: number;
    user_id: number;
    created: boolean;
    rejected: boolean;
  }>;
  for (const group of groups) {
    for (const address of addresses) {
      const memberships = address.Memberships ?? [];
      const found = memberships.find(({ group_id }) => group_id === group.id);
      if (found) {
        const expiresAt = moment(found.last_checked).add(
          config.MEMBERSHIP_REFRESH_TTL_SECONDS,
          'seconds',
        );
        if (moment().isAfter(expiresAt) || force_refresh) {
          const updated = computeMembership(address, group, balances);
          toUpdate.push(updated);
          // make sure we only emit actual changes to membership, not just refreshed dates
          if (!!updated.reject_reason !== !!found.reject_reason)
            toEmit.push({
              group_id: updated.group_id,
              address_id: updated.address_id,
              user_id: address.user_id!,
              created: false,
              rejected: !!updated.reject_reason,
            });
        }
      } else {
        // membership does not exist, create
        const created = computeMembership(address, group, balances);
        toCreate.push(created);
        toEmit.push({
          group_id: created.group_id,
          address_id: created.address_id,
          user_id: address.user_id!,
          created: true,
          rejected: !!created.reject_reason,
        });
      }
    }
  }
  if (toCreate.length === 0 && toUpdate.length === 0) return [0, 0, 0];

  await models.sequelize.transaction(async (transaction) => {
    await models.Membership.bulkCreate([...toCreate, ...toUpdate], {
      updateOnDuplicate: ['reject_reason', 'last_checked'],
      transaction,
    });
    if (toEmit.length)
      await emitEvent(
        models.Outbox,
        [
          {
            event_name: 'MembershipsRefreshed',
            event_payload: {
              community_id,
              membership: toEmit,
              created_at: new Date(),
            },
          },
        ],
        transaction,
      );
  });
  return [toCreate.length, toUpdate.length, toEmit.length];
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
      user_id: { [Op.ne]: null },
      id: { [Op.gt]: minAddressId },
    },
    attributes: ['id', 'address', 'user_id'],
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

export function RefreshCommunityMemberships(): Command<
  typeof schemas.RefreshCommunityMemberships
> {
  return {
    ...schemas.RefreshCommunityMemberships,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, address, group_id } = payload;

      const groups = await models.Group.findAll({
        where: group_id ? { id: group_id, community_id } : { community_id },
      });
      if (groups.length === 0)
        return {
          community_id,
          created: 0,
          updated: 0,
        };

      const communityStartedAt = Date.now();
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalEmitted = 0;
      let totalProcessed = 0;

      const totalAddresses = address
        ? 1
        : await models.Address.count({
            where: { community_id, verified: { [Op.ne]: null } },
          });

      const refresh = async (
        addresses: AddressAttributes[],
        force_refresh = false,
      ) => {
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

        const [created, updated, emitted] = await processMemberships(
          community_id,
          groups,
          addresses,
          balances,
          force_refresh,
        );

        totalCreated += created;
        totalUpdated += updated;
        totalEmitted += emitted;
        totalProcessed += addresses.length;

        log.info(`Refreshed "${community_id}" memberships (${(Date.now() - pageStartedAt) / 1000}s)
  addresses=${totalProcessed}/${totalAddresses}, created=${created}, updated=${updated}, emitted=${emitted}`);
      };

      if (address) {
        const addr = await models.Address.findOne({
          where: { community_id, address, user_id: { [Op.ne]: null } },
          attributes: ['id', 'address', 'user_id'],
          include: {
            model: models.Membership,
            as: 'Memberships',
            required: false,
          },
        });
        addr && (await refresh([addr], true)); // force refresh even if the membership is not expired
      } else await paginateAddresses(community_id, 0, refresh);

      log.info(
        `Finished refreshing "${community_id}" memberships (${(Date.now() - communityStartedAt) / 1000}s)
  total-addresses=${totalProcessed}, total-created=${totalCreated}, total-updated=${totalUpdated}, total-emitted=${totalEmitted}`,
      );

      return { community_id, created: totalCreated, updated: totalUpdated };
    },
  };
}
