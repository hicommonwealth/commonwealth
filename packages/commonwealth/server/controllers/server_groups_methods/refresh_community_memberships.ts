import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { MEMBERSHIP_REFRESH_BATCH_SIZE } from '../../config';
import { DB } from '../../models';
import { AddressAttributes } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { GroupAttributes } from '../../models/group';
import { MembershipAttributes } from '../../models/membership';
import { makeGetBalancesOptions } from '../../util/requirementsModule/makeGetBalancesOptions';
import validateGroupMembership from '../../util/requirementsModule/validateGroupMembership';
import {
  Balances,
  OptionsWithBalances,
} from '../../util/tokenBalanceCache/types';
import { ServerGroupsController } from '../server_groups_controller';

const MEMBERSHIP_TTL_SECONDS = 60 * 2;

export type RefreshCommunityMembershipsOptions = {
  community: CommunityInstance;
  group?: GroupAttributes;
};

export type RefreshCommunityMembershipsResult = MembershipAttributes[];

export async function __refreshCommunityMemberships(
  this: ServerGroupsController,
  { community, group }: RefreshCommunityMembershipsOptions,
): Promise<void> {
  const communityStartedAt = Date.now();

  let groupsToUpdate: GroupAttributes[];
  if (group) {
    groupsToUpdate = [group];
  } else {
    groupsToUpdate = await this.getGroups({ community });
  }

  console.log(
    `Paginating addresses in ${groupsToUpdate.length} groups in ${community.id}...`,
  );

  let totalNumCreated = 0;
  let totalNumUpdated = 0;
  let totalNumAddresses = 0;

  await paginateAddresses(
    this.models,
    community.id,
    1,
    MEMBERSHIP_REFRESH_BATCH_SIZE,
    async (addresses, page) => {
      const pageStartedAt = Date.now();

      const getBalancesOptions = makeGetBalancesOptions(
        groupsToUpdate,
        addresses,
      );
      const balances = await Promise.all(
        getBalancesOptions.map(async (options) => {
          let result: Balances = {};
          try {
            result = await this.tokenBalanceCacheV2.getBalances({
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

      console.log(
        `  * [${page}] Created ${numCreated} and updated ${numUpdated} memberships in ${
          community.id
        } across ${addresses.length} addresses in ${
          (Date.now() - pageStartedAt) / 1000
        }s`,
      );
    },
  );

  console.log(
    `Created ${totalNumCreated} and updated ${totalNumUpdated} total memberships in ${
      community.id
    } across ${totalNumAddresses} addresses in ${
      (Date.now() - communityStartedAt) / 1000
    }s`,
  );
}

// paginateAddresses paginates through all active addresses
// within the community
async function paginateAddresses(
  models: DB,
  communityId: string,
  page: number,
  pageSize: number,
  callback: (addresses: AddressAttributes[], page: number) => Promise<void>,
): Promise<void> {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const addresses = await models.Address.findAll({
    where: {
      community_id: communityId,
      verified: {
        [Op.ne]: null,
      },
    },
    attributes: ['id', 'address'],
    include: {
      model: models.Membership,
      as: 'Memberships',
      required: false,
    },
    offset,
    limit,
  });

  if (addresses.length === 0) {
    return;
  }

  await callback(addresses, page);

  return paginateAddresses(models, communityId, page + 1, pageSize, callback);
}

type ComputedMembership = {
  group_id: number;
  address_id: number;
  reject_reason: string | null;
  last_checked: any;
};

// computeMembership returns a recomputed membership given an address and group
async function computeMembership(
  address: AddressAttributes,
  currentGroup: GroupAttributes,
  balances: OptionsWithBalances[],
): Promise<ComputedMembership> {
  const { requirements } = currentGroup;
  const { isValid, messages } = await validateGroupMembership(
    address.address,
    requirements,
    balances,
  );
  const computedMembership = {
    group_id: currentGroup.id,
    address_id: address.id,
    reject_reason: isValid ? null : JSON.stringify(messages),
    last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
  };
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
      const existingMembership = address.Memberships.find(
        ({ group_id }) => group_id === currentGroup.id,
      );
      if (existingMembership) {
        // membership exists
        const expiresAt = moment(existingMembership.last_checked).add(
          MEMBERSHIP_TTL_SECONDS,
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
        toUpdate.push(computedMembership);
        continue;
      }

      // membership does not exist, create
      const computedMembership = await computeMembership(
        address,
        currentGroup,
        balances,
      );
      toCreate.push(computedMembership);
    }
  }

  // perform creates and updates
  await models.Membership.bulkCreate([...toCreate, ...toUpdate], {
    updateOnDuplicate: ['reject_reason', 'last_checked'],
  });

  return [toCreate.length, toUpdate.length];
}
