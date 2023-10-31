import Bluebird from 'bluebird';
import { flatten } from 'lodash';
import { Op } from 'sequelize';
import { CommunityInstance } from 'server/models/community';
import { MembershipAttributes } from '../../models/membership';
import { refreshMembershipsForAddress } from '../../util/requirementsModule/refreshMembershipsForAddress';
import { ServerGroupsController } from '../server_groups_controller';

export type RefreshCommunityMembershipsOptions = {
  community: CommunityInstance;
};
export type RefreshCommunityMembershipsResult = MembershipAttributes[];

export async function __refreshCommunityMemberships(
  this: ServerGroupsController,
  { community }: RefreshCommunityMembershipsOptions
): Promise<void> {
  const startedAt = Date.now();

  // get all groups across the community
  const groups = await this.models.Group.findAll({
    where: {
      chain_id: community.id,
    },
  });

  // refresh memberships for all addresses in community
  const addresses = await this.models.Address.findAll({
    where: {
      community_id: community.id,
      verified: {
        [Op.ne]: null,
      },
    },
    attributes: ['id', 'address'],
  });

  const result = await Bluebird.map(
    addresses,
    (address) => {
      return refreshMembershipsForAddress(
        this.models,
        this.tokenBalanceCache,
        address,
        groups
      );
    },
    { concurrency: 300 }
  );

  const allMemberships = flatten(result);

  console.log(
    `refreshed ${allMemberships.length} memberships for ${
      groups.length
    } groups and ${addresses.length} addresses in ${community.id} within ${
      (Date.now() - startedAt) / 1000
    }s`
  );
}
