import {
  CommunityInstance,
  CommunitySnapshotSpaceWithSpaceAttached,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';

export type GetCommunitiesOptions = {
  hasGroups?: boolean; // only return communities with associated groups
};
export type GetCommunitiesResult = {
  community: CommunityInstance;
  snapshot: string[];
}[];

export async function __getCommunities(
  this: ServerCommunitiesController,
  { hasGroups }: GetCommunitiesOptions,
): Promise<GetCommunitiesResult> {
  const communitiesInclude = [];
  if (hasGroups) {
    communitiesInclude.push({
      model: this.models.Group,
      required: true,
    });
  }

  const communities = await this.models.Community.findAll({
    where: { active: true },
    include: communitiesInclude,
  });

  const communityIds = communities.map((community) => community.id);
  const snapshotSpaces: CommunitySnapshotSpaceWithSpaceAttached[] =
    await this.models.CommunitySnapshotSpaces.findAll({
      where: {
        community_id: {
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
      (space) => space.community_id === community.id,
    );
    const snapshotSpaceNames = communitySnapshotSpaces.map(
      (space) => space.snapshot_space?.snapshot_space,
    );
    return {
      community,
      snapshot: snapshotSpaceNames.length > 0 ? snapshotSpaceNames : [],
    };
  });

  return communitiesWithSnapshots;
}
