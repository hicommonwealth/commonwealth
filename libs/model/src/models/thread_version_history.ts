import { ThreadVersionHistory } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ThreadAttributes } from './thread';
import type { ModelInstance } from './types';
import { beforeValidateThreadsHook } from './utils';

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
      thread_id: { type: Sequelize.INTEGER, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      timestamp: { type: Sequelize.DATE, allowNull: false },
      content_url: { type: Sequelize.STRING, allowNull: true },
    },
    {
      tableName: 'ThreadVersionHistories',
      timestamps: false,
      indexes: [{ fields: ['thread_id'] }],
      hooks: {
        beforeValidate(instance: ThreadVersionHistoryInstance) {
          beforeValidateThreadsHook(instance);
        },
      },
    },
  );
