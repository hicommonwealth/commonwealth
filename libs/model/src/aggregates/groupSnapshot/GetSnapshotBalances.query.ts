import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { models } from '../../database';

export function GetSnapshotBalances(): Query<
  typeof schemas.GetSnapshotBalances
> {
  return {
    ...schemas.GetSnapshotBalances,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { groupId, snapshotId, address } = payload;

      let snapshot: z.infer<typeof schemas.GroupSnapshot> | null = null;

      if (snapshotId) {
        snapshot = await models.GroupSnapshot.findOne({
          where: {
            id: snapshotId,
            group_id: groupId,
          },
        });
      } else {
        // fallback on latest snapshot
        snapshot = await models.GroupSnapshot.findOne({
          where: {
            group_id: groupId,
            status: 'active',
          },
          order: [['snapshot_date', 'DESC']],
        });
      }

      if (!snapshot) {
        return null;
      }

      if (snapshot.status === 'error') {
        return null;
      }

      const balances = snapshot.balance_map as Record<string, string>;

      // If address is provided, filter to only return that address's balance
      const filteredBalances = address
        ? { [address]: balances[address] || '0' }
        : balances;

      return {
        balances: filteredBalances,
        snapshotId: snapshot.id!,
        groupId: snapshot.group_id,
      };
    },
  };
}
