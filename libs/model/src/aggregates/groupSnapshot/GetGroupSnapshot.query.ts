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

      return snapshot;
    },
  };
}
