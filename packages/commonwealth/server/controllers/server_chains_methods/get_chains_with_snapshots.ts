import { Op } from 'sequelize';
import { ServerChainsController } from '../server_chains_controller';
import { CommunityInstance } from '../../models/community';
import { CommunitySnapshotSpaceWithSpaceAttached } from 'server/models/community_snapshot_spaces';

export type GetChainsWithSnapshotsOptions = {};
export type GetChainsWithSnapshotsResult = {
  chain: CommunityInstance;
  snapshot: string[];
}[];

export async function __getChainsWithSnapshots(
  this: ServerChainsController,
  options: GetChainsWithSnapshotsOptions
): Promise<GetChainsWithSnapshotsResult> {
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
