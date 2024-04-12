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
      contestAddress: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      communityId: {
        type: Sequelize.STRING,
        allowNull: false,
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
      // hooks: syncHooks,
    },
  );
