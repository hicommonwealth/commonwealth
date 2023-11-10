import Bluebird from 'bluebird';
import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { GroupAttributes } from 'server/models/group';
import { AddressAttributes } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { MembershipAttributes } from '../../models/membership';
import validateGroupMembership from '../../util/requirementsModule/validateGroupMembership';
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
  const startedAt = Date.now();

  let groupsToUpdate: GroupAttributes[];
  if (group) {
    groupsToUpdate = [group];
  } else {
    groupsToUpdate = await this.getGroups({ community });
  }

  const addresses = await this.models.Address.findAll({
    where: {
      community_id: community.id,
      verified: {
        [Op.ne]: null,
      },
    },
    attributes: ['id', 'address'],
    include: {
      model: this.models.Membership,
      as: 'Memberships',
      required: false,
    },
  });

  const toCreate = [];
  const toUpdate = [];

  const processMembership = async (
    address: AddressAttributes,
    currentGroup: GroupAttributes,
  ) => {
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
        return;
      }
      // membership stale, update
      const computedMembership = await refreshAndQueueOperation(
        address,
        currentGroup,
      );
      toUpdate.push(computedMembership);
      return;
    }

    // membership does not exist, create
    const computedMembership = await refreshAndQueueOperation(
      address,
      currentGroup,
    );
    toCreate.push(computedMembership);
  };

  const refreshAndQueueOperation = async (
    address: AddressAttributes,
    currentGroup: GroupAttributes,
  ) => {
    const { requirements } = currentGroup;
    const { isValid, messages } = await validateGroupMembership(
      address.address,
      requirements,
      this.tokenBalanceCache,
    );
    const computedMembership = {
      group_id: currentGroup.id,
      address_id: address.id,
      reject_reason: isValid ? null : JSON.stringify(messages),
      last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
    };
    return computedMembership;
  };

  console.log(
    `Checking ${addresses.length} addresses in ${groupsToUpdate.length} groups in ${community.id}...`,
  );

  await Bluebird.map(
    groupsToUpdate,
    async (currentGroup) => {
      return Bluebird.map(
        addresses,
        async (address) => {
          return processMembership(address, currentGroup);
        },
        {
          concurrency: 20,
        },
      );
    },
    { concurrency: 20 },
  );

  console.log(
    `Done checking. Starting ${toCreate.length} creates and ${toUpdate.length} updates...`,
  );

  // first create new rows
  await this.models.Membership.bulkCreate([...toCreate, ...toUpdate], {
    updateOnDuplicate: ['reject_reason', 'last_checked'],
  });

  console.log(
    `Created ${toCreate.length} and updated ${toUpdate.length} memberships in ${
      community.id
    } within ${(Date.now() - startedAt) / 1000}s`,
  );
}
