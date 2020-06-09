import * as Sequelize from 'sequelize';

import { UserAttributes } from './user';
import { ChainAttributes } from './chain';
import { OffchainCommunityAttributes } from './offchain_community';

export interface StarredCommunityAttributes {
  id?: number;
  user_id: number;
  chain?: string;
  community?: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
  Chain?: ChainAttributes;
  OffchainCommunity?: OffchainCommunityAttributes;
}

export interface StarredCommunityInstance extends Sequelize.Instance<StarredCommunityAttributes>, StarredCommunityAttributes {
  // no mixins used
}

export interface StarredCommunityModel extends Sequelize.Model<StarredCommunityInstance, StarredCommunityAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): StarredCommunityModel => {
  const StarredCommunity = sequelize.define<StarredCommunityInstance, StarredCommunityAttributes>('StarredCommunity', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: dataTypes.INTEGER, allowNull: false },
    chain: { type: dataTypes.STRING, allowNull: true },
    community: { type: dataTypes.STRING, allowNull: true },
    active: { type: dataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
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
