import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface IdentityCacheAttributes {
  chain: string;
  address: string;
}

export interface IdentityCacheInstance
  extends Sequelize.Model<IdentityCacheAttributes>,
    IdentityCacheAttributes {}

export type IdentityCacheStatic = ModelStatic<IdentityCacheInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): IdentityCacheStatic => {
  const IdentityCache = <IdentityCacheStatic>sequelize.define(
    'IdentityCache',
    {
      chain: { type: dataTypes.STRING, allowNull: false },
      address: { type: dataTypes.STRING, allowNull: false }
    },
    { timestamps: false }
  );

  IdentityCache.associate = (models) => {
    models.IdentityCache.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
  };

  return IdentityCache;
};
