import { logger } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { models } from '../../database';
import type { GroupSnapshotInstance } from '../../models/groupSnapshot';

const log = logger(import.meta);

export class SnapshotService {
  /**
   * Fetch balance for an address from a group snapshot
   * @param address The address to get the balance for
   * @param groupId The group ID to fetch snapshot from
   * @param snapshotId Optional specific snapshot ID. If not provided, uses the latest active snapshot
   * @returns The balance as a string, or null if not found
   */
  static async fetchBalance(
    address: string,
    groupId: number,
    snapshotId?: number,
  ): Promise<string | null> {
    try {
      let snapshot: GroupSnapshotInstance | null;

      if (snapshotId) {
        // Fetch specific snapshot
        snapshot = await models.GroupSnapshot.findOne({
          where: {
            id: snapshotId,
            group_id: groupId,
          },
        });

        if (!snapshot) {
          log.warn(`Snapshot not found`, { snapshotId, groupId });
          return null;
        }
      } else {
        // Fetch latest active snapshot for the group
        snapshot = await models.GroupSnapshot.findOne({
          where: {
            group_id: groupId,
            status: 'active',
          },
          order: [['snapshot_date', 'DESC']],
        });

        if (!snapshot) {
          log.warn(`No active snapshot found for group`, { groupId });
          return null;
        }
      }

      // Check if the snapshot is in error state
      if (snapshot.status === 'error') {
        log.warn(`Snapshot is in error state`, {
          snapshotId: snapshot.id,
          groupId,
          error: snapshot.error_message,
        });
        return null;
      }

      // Extract balance from the balance_map
      const balanceMap = snapshot.balance_map as Record<string, string>;
      const balance = balanceMap[address] || '0';

      log.debug(`Fetched balance from snapshot`, {
        address,
        groupId,
        snapshotId: snapshot.id,
        balance,
      });

      return balance;
    } catch (error) {
      log.error('Failed to fetch balance from snapshot', error as Error, {
        address,
        groupId,
        snapshotId,
      });
      throw error;
    }
  }

  /**
   * Get all addresses and their balances from a snapshot
   * @param groupId The group ID
   * @param snapshotId Optional specific snapshot ID. If not provided, uses the latest active snapshot
   * @returns Record of address to balance mappings
   */
  static async getSnapshotBalances(
    groupId: number,
    snapshotId?: number,
  ): Promise<Record<string, string> | null> {
    try {
      let snapshot: GroupSnapshotInstance | null;

      if (snapshotId) {
        snapshot = await models.GroupSnapshot.findOne({
          where: {
            id: snapshotId,
            group_id: groupId,
          },
        });
      } else {
        snapshot = await models.GroupSnapshot.findOne({
          where: {
            group_id: groupId,
            status: 'active',
          },
          order: [['snapshot_date', 'DESC']],
        });
      }

      if (!snapshot || snapshot.status === 'error') {
        return null;
      }

      return snapshot.balance_map as Record<string, string>;
    } catch (error) {
      log.error('Failed to get snapshot balances', error as Error, {
        groupId,
        snapshotId,
      });
      throw error;
    }
  }

  /**
   * Mark older snapshots as superseded when a new active snapshot is created
   * @param groupId The group ID
   * @param excludeSnapshotId The new snapshot ID to exclude from being superseded
   */
  static async markSnapshotsAsSuperseded(
    groupId: number,
    excludeSnapshotId: number,
  ): Promise<void> {
    try {
      await models.GroupSnapshot.update(
        { status: 'superseded' },
        {
          where: {
            group_id: groupId,
            status: 'active',
            id: { [Op.ne]: excludeSnapshotId },
          },
        },
      );

      log.info(`Marked old snapshots as superseded`, {
        groupId,
        excludeSnapshotId,
      });
    } catch (error) {
      log.error('Failed to mark snapshots as superseded', error as Error, {
        groupId,
        excludeSnapshotId,
      });
      throw error;
    }
  }
}
