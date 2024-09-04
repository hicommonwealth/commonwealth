import Sequelize from 'sequelize';
import { GroupAttributes } from './GroupAttributes';
import type { ModelInstance } from './types';

export type GroupInstance = ModelInstance<GroupAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<GroupInstance> =>
  sequelize.define<GroupInstance>(
    'Group',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
      metadata: { type: Sequelize.JSON, allowNull: false },
      requirements: { type: Sequelize.JSON, allowNull: false },
      is_system_managed: { type: Sequelize.BOOLEAN, allowNull: false },

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Groups',
      indexes: [{ fields: ['community_id'] }],
    },
  );
