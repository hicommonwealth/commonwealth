import { TwitterCursor } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ModelInstance } from './types';

export type TwitterCursorAttributes = z.infer<typeof TwitterCursor>;

export type TwitterCursorInstance = ModelInstance<TwitterCursorAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<TwitterCursorInstance> =>
  sequelize.define<TwitterCursorInstance>(
    'TwitterCursor',
    {
      bot_name: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      last_polled_timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: 'TwitterCursors',
    },
  );
