import { Contest } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

type Contest = ModelInstance<z.infer<typeof Contest>>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<Contest> =>
  sequelize.define<Contest>(
    'Contest',
    {
      contest_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      contest_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      winners: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
      },
    },
    {
      tableName: 'Contests',
      timestamps: false,
      indexes: [{ fields: ['start_time'] }], // TODO: can we enforce typings in indexes?
    },
  );
