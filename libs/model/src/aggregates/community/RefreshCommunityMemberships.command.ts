import {
  cache,
  CacheNamespaces,
  logger,
  type Command,
} from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceSourceType, WalletSsoSource } from '@hicommonwealth/shared';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import type { GroupAttributes } from '../../models';
import { getBalances } from '../../services/tokenBalanceCache';
import type {
  Balances,
  OptionsWithBalances,
} from '../../services/tokenBalanceCache/types';
import {
  emitEvent,
  makeGetBalancesOptions,
  validateGroupMembership,
  type Membership,
  type Requirement,
  type UserInfo,
} from '../../utils';

const log = logger(import.meta);

function computeMembership(
  user: UserInfo,
  group: GroupAttributes,
  balances: OptionsWithBalances[],
): Membership {
  const { isValid, messages, balance } = validateGroupMembership(
    user,
    group.requirements as Requirement[],
    balances,
    group.metadata.required_requirements!,
  );
  return {
    group_id: group.id!,
    address_id: user.address_id,
    reject_reason: isValid ? undefined : (messages ?? undefined),
    last_checked: new Date(),
    balance,
  };
}

// upserts memberships for each combination of address and group
async function processMemberships(
  community_id: string,
  groups: GroupAttributes[],
  users: UserInfo[],
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
  let tokenHolderGroupId: number | undefined;

  for (const group of groups) {
    // determine if this is a token holder group
    const singleRequirement =
      group.requirements?.length === 1 ? group.requirements?.[0] : undefined;
    tokenHolderGroupId =
      singleRequirement &&
      singleRequirement.rule === 'threshold' &&
      singleRequirement.data.source.source_type === BalanceSourceType.ERC20 &&
      // TODO: compare to launchpad contract address
      singleRequirement.data.source.contract_address
        ? group.id
        : tokenHolderGroupId;

    for (const user of users) {
      const memberships = user.memberships ?? [];
      const found = memberships.find(({ group_id }) => group_id === group.id);
      if (found) {
        const expiresAt = dayjs(found.last_checked).add(
          config.MEMBERSHIP_REFRESH_TTL_SECONDS,
          'seconds',
        );
        if (dayjs().isAfter(expiresAt) || force_refresh) {
          const updated = computeMembership(user, group, balances);
          toUpdate.push(updated);
          // make sure we only emit actual changes to membership, not just refreshed dates
          if (!!updated.reject_reason !== !!found.reject_reason)
            toEmit.push({
              group_id: updated.group_id,
              address_id: updated.address_id,
              user_id: user.user_id,
              created: false,
              rejected: !!updated.reject_reason,
            });
        }
      } else {
        // membership does not exist, create
        const created = computeMembership(user, group, balances);
        toCreate.push(created);
        toEmit.push({
          group_id: created.group_id,
          address_id: created.address_id,
          user_id: user.user_id,
          created: true,
          rejected: !!created.reject_reason,
        });
      }
    }
  }

  if (toCreate.length === 0 && toUpdate.length === 0) return [0, 0, 0];

  // cache token balances for token holders group
  if (tokenHolderGroupId) {
    const toCache = [
      ...toCreate
        .filter(
          (m) => m.group_id === tokenHolderGroupId && (m.balance || 0) > 0,
        )
        .map((m) => ({
          value: m.address_id.toString(),
          score: Number(m.balance) / 1e18,
        })),
      ...toUpdate
        .filter(
          (m) => m.group_id === tokenHolderGroupId && (m.balance || 0) > 0,
        )
        .map((m) => ({
          value: m.address_id.toString(),
          score: Number(m.balance) / 1e18,
        })),
    ];
    if (toCache.length > 0) {
      await cache()
        .addToSortedSet(CacheNamespaces.TokenTopHolders, community_id, toCache)
        .catch((err) => {
          log.error(`Failed to cache token holders for ${community_id}`, err);
        });
    }
  }

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
  callback: (users: UserInfo[]) => Promise<void>,
): Promise<void> {
  const addresses = await models.Address.findAll({
    where: {
      community_id,
      verified: { [Op.ne]: null },
      user_id: { [Op.ne]: null },
      id: { [Op.gt]: minAddressId },
    },
    attributes: ['id', 'address', 'user_id'],
    include: [
      { model: models.User, as: 'User', required: true },
      { model: models.Membership, as: 'Memberships', required: false },
    ],
    order: [['id', 'ASC']],
    limit: config.MEMBERSHIP_REFRESH_BATCH_SIZE,
  });

  if (addresses.length === 0) {
    return;
  }

  const users = addresses.map((a) => ({
    address_id: a.id!,
    address: a.address,
    user_id: a.user_id!,
    user_tier: a.User!.tier,
    wallet_sso: a.oauth_provider as WalletSsoSource,
    memberships: a.Memberships,
  }));
  await callback(users);

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
      const { community_id, address, group_id, refresh_all } = payload;

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

      const refresh = async (users: UserInfo[], force_refresh = false) => {
        const pageStartedAt = Date.now();

        const getBalancesOptions = makeGetBalancesOptions(
          groups,
          users.map((u) => u.address),
        );
        const balances = await Promise.all(
          getBalancesOptions.map(async (options) => {
            let result: Balances = {};
            try {
              result = await getBalances({
                ...options,
                cacheRefresh: refresh_all || false,
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
          users,
          balances,
          force_refresh,
        );

        totalCreated += created;
        totalUpdated += updated;
        totalEmitted += emitted;
        totalProcessed += users.length;

        log.info(`Refreshed "${community_id}" memberships (${(Date.now() - pageStartedAt) / 1000}s)
  addresses=${totalProcessed}/${totalAddresses}, created=${created}, updated=${updated}, emitted=${emitted}`);
      };

      if (address) {
        const addr = await models.Address.findOne({
          where: { community_id, address, user_id: { [Op.ne]: null } },
          attributes: ['id', 'address', 'user_id'],
          include: [
            { model: models.User, as: 'User', required: true },
            { model: models.Membership, as: 'Memberships', required: false },
          ],
        });
        if (addr) {
          const user: UserInfo = {
            address_id: addr.id!,
            address: addr.address,
            user_id: addr.user_id!,
            user_tier: addr.User!.tier,
            wallet_sso: addr.oauth_provider as WalletSsoSource,
            memberships: addr.Memberships,
          };
          await refresh([user], true); // force refresh even if the membership is not expired
        }
      } else await paginateAddresses(community_id, 0, refresh);

      log.info(
        `Finished refreshing "${community_id}" memberships (${(Date.now() - communityStartedAt) / 1000}s)
  total-addresses=${totalProcessed}, total-created=${totalCreated}, total-updated=${totalUpdated}, total-emitted=${totalEmitted}`,
      );

      return { community_id, created: totalCreated, updated: totalUpdated };
    },
  };
}
