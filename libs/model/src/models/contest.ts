import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type Contest = ModelInstance<z.infer<typeof schemas.projections.Contest>>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<Contest>>sequelize.define<Contest>(
    'Contest',
    {
      contestAddress: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      contestId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endTime: {
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
