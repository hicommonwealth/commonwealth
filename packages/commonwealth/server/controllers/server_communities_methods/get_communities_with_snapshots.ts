import { Op } from 'sequelize';
import { ServerCommunitiesController } from '../server_communities_controller';
import { ChainInstance } from 'server/models/chain';
import { CommunitySnapshotSpaceWithSpaceAttached } from 'server/models/community_snapshot_spaces';

export type GetCommunitiesWithSnapshotsOptions = {};
export type GetCommunitiesWithSnapshotsResult = {
  chain: ChainInstance;
  snapshot: string[];
}[];

export async function __getCommunitiesWithSnapshots(
  this: ServerCommunitiesController,
  options: GetCommunitiesWithSnapshotsOptions
): Promise<GetCommunitiesWithSnapshotsResult> {
  const [chains] = await Promise.all([
    this.models.Chain.findAll({
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
