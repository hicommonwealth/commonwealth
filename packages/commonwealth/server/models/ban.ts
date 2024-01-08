import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type BanAttributes = {
  id?: number;
  address: string;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;
};

export type BanInstance = ModelInstance<BanAttributes>;
export type BanModelStatic = ModelStatic<BanInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): BanModelStatic => {
  const Ban = <BanModelStatic>sequelize.define(
    'Bans',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      address: { type: dataTypes.STRING, allowNull: false },
      community_id: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
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

  Ban.associate = (models) => {
    models.Ban.belongsTo(models.Community);
  };

  return Ban;
};
