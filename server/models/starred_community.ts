import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import { ModelStatic } from './types';
import { UserAttributes } from './user';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';

export interface StarredCommunityAttributes {
  user_id: number;
  id?: number;
  chain?: string;
  community?: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
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
    chain: { type: dataTypes.STRING, allowNull: true },
    community: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    tableName: 'StarredCommunities',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['chain'] },
      { fields: ['community'] },
    ],
  });

  StarredCommunity.associate = (models) => {
    models.StarredCommunity.belongsTo(models.User);
    models.StarredCommunity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.StarredCommunity.belongsTo(models.OffchainCommunity, { foreignKey: 'community', targetKey: 'id' });
  };

  return StarredCommunity;
};
