import { DLQEvent } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type DlqInstance = ModelInstance<DLQEvent>;
export type DlqModelStatic = Sequelize.ModelStatic<DlqInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <DlqModelStatic>sequelize.define<DlqInstance>(
    'Dlq',
    {
      consumer: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      event_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      event_name: { type: Sequelize.STRING, allowNull: false },
      reason: { type: Sequelize.STRING, allowNull: false },
      timestamp: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      tableName: 'Dlq',
      underscored: true,
    },
  );
