import { ServerChainsController } from '../server_chains_controller';
import { GroupAttributes } from 'server/models/group';
import { ChainInstance } from 'server/models/chain';
import { flatten } from 'lodash';
import { Filterable, Op, WhereOptions } from 'sequelize';
import { MembershipAttributes } from 'server/models/membership';

export type GetGroupsOptions = {
  chain: ChainInstance;
  addressId?: number;
  withMembers?: boolean;
};

type GroupWithMemberships = GroupAttributes & {
  memberships?: MembershipAttributes[];
};
export type GetGroupsResult = GroupWithMemberships[];

export async function __getGroups(
  this: ServerChainsController,
  { chain, addressId, withMembers }: GetGroupsOptions
): Promise<GetGroupsResult> {
  const chainTopics = await this.models.Topic.findAll({
    where: {
      chain_id: chain.id,
    },
  });

  const groupIds = flatten(chainTopics.map((topic) => topic.group_ids));

  let groups = await this.models.Group.findAll({
    where: {
      id: { [Op.in]: groupIds },
    },
  });

  if (withMembers) {
    // optionally include members with groups
    const where: WhereOptions<MembershipAttributes> = {
      group_id: {
        [Op.in]: groupIds,
      },
    };
    if (addressId) {
      // optionally filter by specified address ID
      where.address_id = addressId;
    }
    const members = await this.models.Membership.findAll({
      where,
    });
    const groupIdMembersMap: Record<number, MembershipAttributes[]> =
      members.reduce((acc, member) => {
        return {
          ...acc,
          [member.group_id]: (acc[member.group_id] || []).concat(member),
        };
      }, {});
    const groupsWithMemberships = groups.map((group) => ({
      ...group.toJSON(),
      memberships: groupIdMembersMap[group.id] || [],
    }));
    return groupsWithMemberships;
  }

  return groups.map((group) => group.toJSON());
}
