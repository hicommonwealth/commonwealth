import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from './types';
import { UserAttributes } from './user';
import { ChainAttributes } from './chain';

export interface StarredCommunityAttributes {
  user_id: number;
  id?: number;
  chain: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
  Chain?: ChainAttributes;
}

export interface StarredCommunityInstance extends Model<StarredCommunityAttributes>,
StarredCommunityAttributes {
  // no mixins used
}

export type StarredCommunityModelStatic = ModelStatic<StarredCommunityInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): StarredCommunityModelStatic => {
  const StarredCommunity = <StarredCommunityModelStatic>sequelize.define('StarredCommunity', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: dataTypes.INTEGER, allowNull: false },
    chain: { type: dataTypes.STRING, allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    tableName: 'StarredCommunities',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['chain'] },
    ],
  });

  StarredCommunity.associate = (models) => {
    models.StarredCommunity.belongsTo(models.User);
    models.StarredCommunity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
  };

  return StarredCommunity;
};
