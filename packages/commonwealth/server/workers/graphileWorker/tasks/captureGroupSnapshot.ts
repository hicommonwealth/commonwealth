import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { GraphileTask, TaskPayloads } from '@hicommonwealth/model/services';
import { SnapshotService } from '@hicommonwealth/model/services/snapshot';
import { SuiNFTProvider } from '@hicommonwealth/model/services/tokenBalanceCache/providers/SuiNFTProvider';

const log = logger(import.meta);

export const captureGroupSnapshotTask: GraphileTask<
  typeof TaskPayloads.CaptureGroupSnapshot
> = {
  input: TaskPayloads.CaptureGroupSnapshot,
  fn: captureGroupSnapshot,
};

export async function captureGroupSnapshot(payload: {
  groupId: number;
  source: {
    type: 'sui_nft';
    suiNetwork: string;
    collectionId: string;
  };
  blockHeight?: bigint;
}) {
  const { groupId, source, blockHeight } = payload;

  log.info('Starting group snapshot capture', {
    groupId,
    source,
    blockHeight: blockHeight?.toString(),
  });

  let snapshotId: number | undefined;

  try {
    // 1. Fetch the group and its members
    const group = await models.Group.findByPk(groupId, {
      include: [
        {
          model: models.Membership,
          as: 'memberships',
          include: [
            {
              model: models.Address,
              as: 'address',
            },
          ],
        },
      ],
    });

    if (!group) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    // 2. Extract addresses from group memberships
    const addresses =
      group.memberships
        ?.map((membership) => membership.address?.address)
        .filter((address): address is string => !!address) || [];

    if (addresses.length === 0) {
      log.warn('No addresses found for group', { groupId });
      return;
    }

    log.info(`Found ${addresses.length} addresses in group`, { groupId });

    // 3. Create a pending snapshot record
    const snapshot = await models.GroupSnapshot.create({
      group_id: groupId,
      block_height: blockHeight || null,
      snapshot_source: `${source.type}:${source.suiNetwork}:${source.collectionId}`,
      balance_map: {},
      status: 'pending',
      snapshot_date: new Date(),
    });

    snapshotId = snapshot.id;
    log.info('Created pending snapshot', { snapshotId, groupId });

    // 4. Fetch balances using SuiNFTProvider
    const balances = await SuiNFTProvider.getSnapshot(
      addresses,
      source,
      blockHeight,
    );

    // 5. Update snapshot with balances and mark as active
    await snapshot.update({
      balance_map: balances,
      status: 'active',
    });

    // 6. Mark other active snapshots as superseded
    await SnapshotService.markSnapshotsAsSuperseded(groupId, snapshot.id);

    log.info('Successfully captured group snapshot', {
      snapshotId,
      groupId,
      addressCount: addresses.length,
      totalAddressesWithBalance: Object.keys(balances).length,
    });
  } catch (error) {
    log.error('Failed to capture group snapshot', error as Error, {
      groupId,
      source,
      snapshotId,
    });

    // Mark snapshot as error if we created one
    if (snapshotId) {
      try {
        await models.GroupSnapshot.update(
          {
            status: 'error',
            error_message: (error as Error).message,
          },
          {
            where: { id: snapshotId },
          },
        );
      } catch (updateError) {
        log.error(
          'Failed to update snapshot error status',
          updateError as Error,
          {
            snapshotId,
          },
        );
      }
    }

    throw error;
  }
}
