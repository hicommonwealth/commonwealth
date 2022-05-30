import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type IdentityCacheAttributes = {
  community_id: string;
  address: string;
}

export interface IdentityCacheInstance
  extends Sequelize.Model<IdentityCacheAttributes>,
    IdentityCacheAttributes {}

export type IdentityCacheStatic = ModelStatic<IdentityCacheInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): IdentityCacheStatic => {
  const IdentityCache = <IdentityCacheStatic>sequelize.define(
    'IdentityCache',
    {
      community_id: { type: dataTypes.STRING, allowNull: false },
      address: { type: dataTypes.STRING, allowNull: false }
    },
    { timestamps: false }
  );

  // we don't define a primary key so sequelize assumes a primary key on column "id" so this removes that assumption
  IdentityCache.removeAttribute('id');

  IdentityCache.associate = (models) => {
    models.IdentityCache.belongsTo(models.Community, { foreignKey: 'community_id', targetKey: 'id' });
  };

  return IdentityCache;
};
