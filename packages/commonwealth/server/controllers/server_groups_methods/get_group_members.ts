import { WhereOptions } from 'sequelize';
import { TypedPaginatedResult } from 'server/types';
import { OrderByOptions } from '../../../../common-common/src/api/extApiTypes';
import { CommunityInstance } from '../../models/community';
import { MembershipAttributes } from '../../models/membership';
import { formatPagination } from '../../util/queries';
import { ServerGroupsController } from '../server_groups_controller';

export type GetGroupMembersOptions = {
  community: CommunityInstance;
  groupId: number;
  limit?: number;
  page?: number;
};

export type GetGroupMembersResult = TypedPaginatedResult<MembershipAttributes>;

export async function __getGroupMembers(
  this: ServerGroupsController,
  { community, groupId, limit, page }: GetGroupMembersOptions
): Promise<GetGroupMembersResult> {
  const group = await this.models.Group.findOne({
    where: {
      id: groupId,
      chain_id: community.id,
    },
  });
  const membershipsWhere: WhereOptions<MembershipAttributes> = {
    group_id: group.id,
  };
  const [totalResults, members] = await Promise.all([
    this.models.Membership.count({
      where: membershipsWhere,
    }),
    this.models.Membership.findAll({
      where: membershipsWhere,
      ...formatPagination({
        limit,
        page,
        sort: OrderByOptions.LAST_CHECKED,
      }),
      include: [
        {
          model: this.models.Address,
          as: 'address',
        },
      ],
    }),
  ]);
  return {
    results: members.map((m) => m.toJSON()),
    limit: limit,
    page: page,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
}
