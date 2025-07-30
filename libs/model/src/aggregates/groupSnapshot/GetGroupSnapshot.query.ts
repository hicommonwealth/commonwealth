import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetGroupSnapshot(): Query<typeof schemas.GetGroupSnapshot> {
  return {
    ...schemas.GetGroupSnapshot,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { snapshotId } = payload;

      const snapshot = await models.GroupSnapshot.findByPk(snapshotId);

      if (!snapshot) {
        return null;
      }

      return {
        id: snapshot.id!,
        group_id: snapshot.group_id,
        block_height: snapshot.block_height ?? null,
        snapshot_source: snapshot.snapshot_source,
        balance_map: snapshot.balance_map,
        status: snapshot.status,
        error_message: snapshot.error_message ?? null,
        snapshot_date: snapshot.snapshot_date,
        created_at: snapshot.created_at!,
        updated_at: snapshot.updated_at!,
      };
    },
  };
}
