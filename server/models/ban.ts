import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type BanAttributes = {
  id?: number;
  banner_text: string;
  chain_id: string;
  created_at?: Date;
  updated_at?: Date;
}

export type BanInstance = ModelInstance<BanAttributes> & {
}

export type BanModelStatic = ModelStatic<BanInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): BanModelStatic => {
  const Ban = <BanModelStatic>sequelize.define('Bans', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address_id: { type: dataTypes.INTEGER, allowNull: false },
    chain_id: { type: dataTypes.STRING, allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    tableName: 'Bans',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true,
  });

  Ban.associate = (models) => {
    models.Ban.belongsTo(models.Chain)
  }

  return Ban;
};
