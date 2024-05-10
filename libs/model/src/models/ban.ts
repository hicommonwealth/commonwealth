import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type BanAttributes = {
  id?: number;
  address: string;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;
};

export type BanInstance = ModelInstance<BanAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<BanInstance> =>
  sequelize.define<BanInstance>(
    'Bans',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      address: { type: Sequelize.STRING, allowNull: false },
      community_id: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'Bans',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
      indexes: [{ fields: ['community_id'] }],
    },
  );
