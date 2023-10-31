import { Op } from 'sequelize';
import { CommunityInstance } from '../../models/community';
import { CommunitySnapshotSpaceWithSpaceAttached } from '../../models/community_snapshot_spaces';
import { ServerCommunitiesController } from '../server_communities_controller';

export type GetCommunitiesOptions = {};
export type GetCommunitiesResult = {
  chain: CommunityInstance;
  snapshot: string[];
}[];

export async function __getCommunities(
  this: ServerCommunitiesController
): Promise<GetCommunitiesResult> {
  const [communities] = await Promise.all([
    this.models.Community.findAll({
      where: { active: true },
    }),
  ]);

  const communityIds = communities.map((community) => community.id);
  const snapshotSpaces: CommunitySnapshotSpaceWithSpaceAttached[] =
    await this.models.CommunitySnapshotSpaces.findAll({
      where: {
        chain_id: {
          [Op.in]: communityIds,
        },
      },
      include: {
        model: this.models.SnapshotSpace,
        as: 'snapshot_space',
      },
    });

  const communitiesWithSnapshots = communities.map((community) => {
    const communitySnapshotSpaces = snapshotSpaces.filter(
      (space) => space.chain_id === community.id
    );
    const snapshotSpaceNames = communitySnapshotSpaces.map(
      (space) => space.snapshot_space?.snapshot_space
    );
    return {
      chain: community,
      snapshot: snapshotSpaceNames.length > 0 ? snapshotSpaceNames : [],
    };
  });

  return communitiesWithSnapshots;
}
