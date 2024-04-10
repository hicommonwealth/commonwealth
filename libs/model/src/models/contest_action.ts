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
      contest: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      contentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      action: {
        type: Sequelize.ENUM(...schemas.projections.CONSTEST_ACTIONS),
        primaryKey: true,
      },
      contentUrl: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      weight: {
        type: Sequelize.INTEGER, // TODO: we have integer in stakes, is this OK?
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      winners: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
    },
    {
      tableName: 'ContestActions',
      timestamps: false,
      underscored: true,
      indexes: [],
    },
  );
