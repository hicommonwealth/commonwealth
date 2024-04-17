import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type Contest = ModelInstance<z.infer<typeof schemas.projections.Contest>>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<Contest>>sequelize.define<Contest>(
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
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
    },
    {
      tableName: 'Contests',
      timestamps: false,
      underscored: true,
      indexes: [{ fields: ['start_time'] }], // TODO: can we enforce typings in indexes?
      // hooks: syncHooks,
    },
  );
