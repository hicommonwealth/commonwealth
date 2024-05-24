import { ThreadVersionHistory } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ThreadAttributes } from './thread';
import type { ModelInstance } from './types';

export type ThreadVersionHistoryAttributes = z.infer<
  typeof ThreadVersionHistory
> & {
  // associations
  Thread?: ThreadAttributes;
};

export type ThreadVersionHistoryInstance =
  ModelInstance<ThreadVersionHistoryAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ThreadVersionHistoryInstance> =>
  sequelize.define<ThreadVersionHistoryInstance>(
    'ThreadVersionHistory',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: Sequelize.INTEGER, primaryKey: true },
      address: { type: Sequelize.STRING, allowNull: true },
      body: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
      tableName: 'ThreadVersionHistories',
      indexes: [{ fields: ['thread_id'] }],
    },
  );
