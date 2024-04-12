import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type ContestAction = ModelInstance<
  z.infer<typeof schemas.projections.ContestAction>
>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<ContestAction>>sequelize.define<ContestAction>(
    'ContestAction',
    {
      contestAddress: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      contestId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      contentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      actorAddress: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      action: {
        type: Sequelize.ENUM(...schemas.projections.CONSTEST_ACTIONS),
        primaryKey: true,
      },
      contentUrl: {
        type: Sequelize.STRING,
      },
      votingPower: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ContestActions',
      timestamps: false,
      underscored: true,
      indexes: [],
      // hooks: syncHooks,
    },
  );
