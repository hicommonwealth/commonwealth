import { ServerChainsController } from '../server_chains_controller';
import { GroupAttributes } from 'server/models/group';
import { ChainInstance } from 'server/models/chain';
import { flatten } from 'lodash';
import { Op } from 'sequelize';
import Bluebird from 'bluebird';
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
  /*
    TODO: Query groups from DB, optionally include allowed membership
  */

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
    // include members with groups
    const members = await this.models.Membership.findAll({
      where: {
        group_id: {
          [Op.in]: groupIds,
        },
      },
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
