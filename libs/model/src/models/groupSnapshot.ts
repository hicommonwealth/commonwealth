import { GroupSnapshot } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod/v4';
import type { GroupAttributes } from './group';
import type { ModelInstance } from './types';

export type GroupSnapshotAttributes = z.infer<typeof GroupSnapshot> & {
  // associations
  group?: GroupAttributes;
};

export type GroupSnapshotInstance = ModelInstance<GroupSnapshotAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<GroupSnapshotInstance> =>
  sequelize.define<GroupSnapshotInstance>(
    'GroupSnapshot',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Groups',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      block_height: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      snapshot_source: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      balance_map: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      group_requirements: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      snapshot_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'GroupSnapshots',
      indexes: [
        { fields: ['group_id'] },
        { fields: ['status'] },
        { fields: ['group_id', 'status'] },
        { fields: ['snapshot_date'] },
      ],
    },
  );
