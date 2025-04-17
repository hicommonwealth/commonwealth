import { logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import type { Requirement } from '@hicommonwealth/shared';
import moment from 'moment';
import { Op } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models } from '../../database';
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

// --- Duplicated Logic Start (Consider Refactoring) ---
// (Copied from RefreshCommunityMemberships.command.ts - adjust if needed)
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

async function processUserMemberships(
  community_id: string,
  groups: GroupAttributes[],
  address: AddressAttributes, // Single address
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
    const memberships = address.Memberships ?? [];
    const found = memberships.find(({ group_id }) => group_id === group.id);
    if (found) {
      const expiresAt = moment(found.last_checked).add(
        config.MEMBERSHIP_REFRESH_TTL_SECONDS,
        'seconds',
      );
      // Always force refresh for explicit user requests, ignore TTL
      if (force_refresh || moment().isAfter(expiresAt)) {
        const updated = computeMembership(address, group, balances);
        toUpdate.push(updated);
        if (!!updated.reject_reason !== !!found.reject_reason) {
          toEmit.push({
            group_id: updated.group_id,
            address_id: updated.address_id,
            user_id: address.user_id!,
            created: false,
            rejected: !!updated.reject_reason,
          });
        }
      }
    } else {
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

  if (toCreate.length === 0 && toUpdate.length === 0) return [0, 0, 0];

  await models.sequelize.transaction(async (transaction) => {
    await models.Membership.bulkCreate([...toCreate, ...toUpdate], {
      updateOnDuplicate: ['reject_reason', 'last_checked'],
      transaction,
    });
    if (toEmit.length) {
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
    }
  });
  return [toCreate.length, toUpdate.length, toEmit.length];
}
// --- Duplicated Logic End ---

export function RefreshUserMemberships(): Command<
  typeof schemas.RefreshUserMemberships
> {
  return {
    ...schemas.RefreshUserMemberships,
    auth: [
      // Check if user is authenticated and has an address
      (ctx) => !!ctx.actor.user?.id && !!ctx.actor.address,
    ],
    body: async ({ payload, actor }) => {
      const { community_id } = payload;
      const userAddress = actor.address!;
      const userId = actor.user!.id!;

      log.info(
        `User ${userId} (${userAddress}) requested membership refresh for community ${community_id}`,
      );

      const startedAt = Date.now();

      // 1. Find the user's address record in this community
      const addr = await models.Address.findOne({
        where: {
          community_id,
          address: userAddress,
          user_id: userId, // Ensure it matches the authenticated user
          verified: { [Op.ne]: null }, // Only refresh for verified addresses
        },
        attributes: ['id', 'address', 'user_id'],
        include: {
          model: models.Membership,
          as: 'Memberships',
          required: false,
        },
      });

      if (!addr) {
        log.warn(
          `No verified address found for user ${userId} (${userAddress}) in community ${community_id}`,
        );
        // Decide if this should be an error or just return 0 counts
        // Returning 0 counts might be less disruptive for the user
        return { community_id, created: 0, updated: 0 };
        // Or throw: throw new AppError(Errors.AddressNotFound);
      }

      // 2. Find all groups in the community
      const groups = await models.Group.findAll({ where: { community_id } });
      if (groups.length === 0) {
        log.info(
          `No groups found for community ${community_id}, skipping refresh.`,
        );
        return { community_id, created: 0, updated: 0 };
      }

      // 3. Get balances for the user's address relevant to the groups
      const getBalancesOptions = makeGetBalancesOptions(
        groups,
        [addr.address], // Only this user's address
      );
      const balances = await Promise.all(
        getBalancesOptions.map(async (options) => {
          let result: Balances = {};
          try {
            // Use cacheRefresh: true to force fetching latest balances for user request
            result = await tokenBalanceCache.getBalances({
              ...options,
              cacheRefresh: true,
            });
          } catch (err) {
            log.error(
              `Failed to get balances for ${addr.address} with options: ${JSON.stringify(options)}`,
              err,
            );
            // Continue without balances for this option, might lead to incorrect membership
          }
          return {
            options,
            balances: result,
          };
        }),
      );

      // 4. Process memberships for this user across all groups
      const [created, updated, emitted] = await processUserMemberships(
        community_id,
        groups,
        addr,
        balances,
        true, // Always force refresh for user-triggered command
      );

      log.info(
        `Finished refreshing memberships for user ${userId} (${userAddress}) in "${community_id}" (${(Date.now() - startedAt) / 1000}s)
  created=${created}, updated=${updated}, emitted=${emitted}`,
      );

      return { community_id, created, updated };
    },
  };
}
