import Bluebird from 'bluebird';
import moment from 'moment';
import { Op, Sequelize } from 'sequelize';
import { AddressAttributes } from '../../models/address';
import { CommunityInstance } from '../../models/community';
import { MembershipAttributes } from '../../models/membership';
import validateGroupMembership from '../../util/requirementsModule/validateGroupMembership';
import { ServerGroupsController } from '../server_groups_controller';

const MEMBERSHIP_TTL_SECONDS = 60 * 2;

export type RefreshCommunityMembershipsOptions = {
  community: CommunityInstance;
};
export type RefreshCommunityMembershipsResult = MembershipAttributes[];

export async function __refreshCommunityMemberships(
  this: ServerGroupsController,
  { community }: RefreshCommunityMembershipsOptions,
): Promise<void> {
  const startedAt = Date.now();

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
      include: [
        {
          model: this.models.Group,
          as: 'group',
        },
      ],
    },
  });

  const toInsert = [];
  const toUpdate = [];

  const processMembership = async (
    address: AddressAttributes,
    membership: MembershipAttributes | null,
  ) => {
    if (membership) {
      // membership exists
      const expiresAt = moment(membership.last_checked).add(
        MEMBERSHIP_TTL_SECONDS,
        'seconds',
      );
      if (moment().isBefore(expiresAt)) {
        // membership is fresh, do nothing
        return;
      }
      // membership is stale, recompute
      return refreshAndQueueOperation(address, membership);
    }
    // membership does not exist, create
    return refreshAndQueueOperation(address, null);
  };

  const refreshAndQueueOperation = async (
    address: AddressAttributes,
    membership: MembershipAttributes | null,
  ) => {
    const { requirements } = membership.group;
    const { isValid, messages } = await validateGroupMembership(
      address.address,
      requirements,
      this.tokenBalanceCache,
    );
    const computedMembership = {
      group_id: membership.group.id,
      address_id: address.id,
      reject_reason: isValid ? null : JSON.stringify(messages),
      last_checked: Sequelize.literal('CURRENT_TIMESTAMP') as any,
    };
    if (!membership) {
      toInsert.push(computedMembership);
      return;
    }
    toUpdate.push(computedMembership);
  };

  await Bluebird.map(
    addresses,
    async (address) => {
      return Bluebird.map(
        address.Memberships,
        async (membership) => {
          return processMembership(address, membership);
        },
        {
          concurrency: 20,
        },
      );
    },
    { concurrency: 20 },
  );

  console.log(
    `inserted ${toInsert.length} memberships and updated ${
      toUpdate.length
    } memberships in ${community.id} within ${
      (Date.now() - startedAt) / 1000
    }s`,
  );
}
