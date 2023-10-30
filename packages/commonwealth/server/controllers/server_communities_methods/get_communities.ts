import { Op } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';
import { CommunityInstance } from '../../models/community';
import { CommunitySnapshotSpaceWithSpaceAttached } from '../../models/community_snapshot_spaces';

export type GetCommunitiesOptions = {};
export type GetCommunitiesResult = {
  chain: CommunityInstance;
  snapshot: string[];
}[];

export async function __getCommunities(
  this: ServerCommunitiesController,
  options: GetCommunitiesOptions
): Promise<GetCommunitiesResult> {
  const [chains] = await Promise.all([
    this.models.Community.findAll({
      where: { active: true },
    }),
  ]);

  const chainsIds = chains.map((chain) => chain.id);
  const snapshotSpaces: CommunitySnapshotSpaceWithSpaceAttached[] =
    await this.models.CommunitySnapshotSpaces.findAll({
      where: {
        chain_id: {
          [Op.in]: chainsIds,
        },
      },
      include: {
        model: this.models.SnapshotSpace,
        as: 'snapshot_space',
      },
    });

  const chainsWithSnapshots = chains.map((chain) => {
    const chainSnapshotSpaces = snapshotSpaces.filter(
      (space) => space.chain_id === chain.id
    );
    const snapshotSpaceNames = chainSnapshotSpaces.map(
      (space) => space.snapshot_space?.snapshot_space
    );
    return {
      chain,
      snapshot: snapshotSpaceNames.length > 0 ? snapshotSpaceNames : [],
    };
  });

  return chainsWithSnapshots;
}
