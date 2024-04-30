import type * as Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';
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

export default (sequelize: Sequelize.Sequelize) =>
  <StarredCommunityModelStatic>sequelize.define<StarredCommunityInstance>(
    'StarredCommunity',
    {
      user_id: { type: dataTypes.INTEGER, primaryKey: true },
      community_id: { type: dataTypes.STRING, primaryKey: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'StarredCommunities',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
