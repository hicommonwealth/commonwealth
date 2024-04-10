import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type ContestManager = ModelInstance<
  z.infer<typeof schemas.projections.ContestManager>
>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<ContestManager>>sequelize.define<ContestManager>(
    'ContestManager',
    {
      address: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true,
        allowNull: false,
      },
      communityId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'Communities' },
      },
      interval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ContestManagers',
      timestamps: false,
      underscored: true,
      indexes: [],
    },
  );
