import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type Contest = ModelInstance<z.infer<typeof schemas.projections.Contest>>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<Contest>>sequelize.define<Contest>(
    'Contest',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      contest: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ContestManagers', key: 'address' }, // TODO: can we enforce typings in references
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'Contests',
      timestamps: false,
      underscored: true,
      indexes: [{ fields: ['start_time'] }], // TODO: can we enforce typings in indexes?
    },
  );
