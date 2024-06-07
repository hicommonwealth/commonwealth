import { AppError, logger } from '@hicommonwealth/core';
import {
  AddressAttributes,
  Balances,
  DB,
  GroupAttributes,
  MembershipAttributes,
  MembershipRejectReason,
  OptionsWithBalances,
  tokenBalanceCache,
} from '@hicommonwealth/model';
import type { Requirement } from '@hicommonwealth/shared';
import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { config } from '../../config';
import { makeGetBalancesOptions } from '../../util/requirementsModule/makeGetBalancesOptions';
import validateGroupMembership from '../../util/requirementsModule/validateGroupMembership';
import { ServerGroupsController } from '../server_groups_controller';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

const Errors = {
  GroupNotFound: 'Group not found',
};

export type RefreshCommunityMembershipsOptions = {
  communityId: string;
  groupId?: number;
};

export type RefreshCommunityMembershipsResult = MembershipAttributes[];

export async function __refreshCommunityMemberships(
  this: ServerGroupsController,
  { communityId, groupId }: RefreshCommunityMembershipsOptions,
): Promise<void> {
  const communityStartedAt = Date.now();

  let groupsToUpdate: GroupAttributes[];
  if (groupId) {
    const group = await this.models.Group.findByPk(groupId);
    if (!group) {
      throw new AppError(Errors.GroupNotFound);
    }
    groupsToUpdate = [group];
  } else {
    groupsToUpdate = await this.getGroups({ communityId });
  }

  log.info(
    `Paginating addresses in ${groupsToUpdate.length} groups in ${communityId}...`,
  );

  let totalNumCreated = 0;
  let totalNumUpdated = 0;
  let totalNumAddresses = 0;

  await paginateAddresses(this.models, communityId, 0, async (addresses) => {
    const pageStartedAt = Date.now();

    const getBalancesOptions = makeGetBalancesOptions(
      groupsToUpdate,
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

    const [numCreated, numUpdated] = await processMemberships(
      this.models,
      groupsToUpdate,
      addresses,
      balances,
    );

    totalNumCreated += numCreated;
    totalNumUpdated += numUpdated;
    totalNumAddresses += addresses.length;

    log.info(
      `Created ${numCreated} and updated ${numUpdated} memberships in ${communityId} across ${
        addresses.length
      } addresses in ${(Date.now() - pageStartedAt) / 1000}s`,
    );
  });

  log.info(
    `Created ${totalNumCreated} and updated ${totalNumUpdated} total memberships in
    ${communityId} across ${totalNumAddresses} addresses in ${
      (Date.now() - communityStartedAt) / 1000
    }s`,
  );
}

// paginateAddresses paginates through all active addresses
// within the community
async function paginateAddresses(
  models: DB,
  communityId: string,
  minAddressId: number,
  callback: (addresses: AddressAttributes[]) => Promise<void>,
): Promise<void> {
  const addresses = await models.Address.findAll({
    // @ts-expect-error StrictNullChecks
    where: {
      community_id: communityId,
      verified: {
        [Op.ne]: null,
      },
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
    models,
    communityId,
    addresses[addresses.length - 1].id,
    callback,
  );
}

type ComputedMembership = {
  group_id: number;
  address_id: number;
  reject_reason: MembershipRejectReason;
  last_checked: any;
};

// computeMembership returns a recomputed membership given an address and group
async function computeMembership(
  address: AddressAttributes,
  currentGroup: GroupAttributes,
  balances: OptionsWithBalances[],
): Promise<ComputedMembership> {
  const { requirements } = currentGroup;
  const { isValid, messages } = validateGroupMembership(
    address.address,
    requirements as Requirement[],
    balances,
    currentGroup.metadata.required_requirements,
  );
  const computedMembership = {
    group_id: currentGroup.id,
    address_id: address.id,
    reject_reason: isValid ? null : messages,
    last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
  };
  // @ts-expect-error StrictNullChecks
  return computedMembership;
}

// processMemberships upserts memberships for each
// combination of address and group
async function processMemberships(
  models: DB,
  groupsToUpdate: GroupAttributes[],
  addresses: AddressAttributes[],
  balances: OptionsWithBalances[],
): Promise<[number, number]> {
  const toCreate = [];
  const toUpdate = [];

  for (const currentGroup of groupsToUpdate) {
    for (const address of addresses) {
      // populate toCreate and toUpdate arrays
      // @ts-expect-error StrictNullChecks
      const existingMembership = address.Memberships.find(
        ({ group_id }) => group_id === currentGroup.id,
      );
      if (existingMembership) {
        // membership exists
        const expiresAt = moment(existingMembership.last_checked).add(
          config.MEMBERSHIP_REFRESH_TTL_SECONDS,
          'seconds',
        );
        if (moment().isBefore(expiresAt)) {
          // membership is fresh, do nothing
          continue;
        }
        // membership stale, update
        const computedMembership = await computeMembership(
          address,
          currentGroup,
          balances,
        );
        // @ts-expect-error StrictNullChecks
        toUpdate.push(computedMembership);
        continue;
      }

      // membership does not exist, create
      const computedMembership = await computeMembership(
        address,
        currentGroup,
        balances,
      );
      // @ts-expect-error StrictNullChecks
      toCreate.push(computedMembership);
    }
  }

  // perform creates and updates
  await models.Membership.bulkCreate([...toCreate, ...toUpdate], {
    updateOnDuplicate: ['reject_reason', 'last_checked'],
  });

  return [toCreate.length, toUpdate.length];
}
