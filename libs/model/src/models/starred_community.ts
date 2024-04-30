import type * as Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { DataTypes, ModelInstance, ModelStatic } from './types';
import type { UserAttributes } from './user';

export type StarredCommunityAttributes = {
  user_id: number;
  id?: number;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
  Community?: CommunityAttributes;
};

export type StarredCommunityInstance =
  ModelInstance<StarredCommunityAttributes>;

export type StarredCommunityModelStatic = ModelStatic<StarredCommunityInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): StarredCommunityModelStatic => {
  const StarredCommunity = <StarredCommunityModelStatic>sequelize.define(
    'StarredCommunity',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: dataTypes.INTEGER, allowNull: false },
      community_id: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'StarredCommunities',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['user_id', 'community_id'], unique: true }],
    },
  );

  StarredCommunity.associate = (models) => {
    models.StarredCommunity.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'id',
    });
    models.StarredCommunity.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return StarredCommunity;
};
