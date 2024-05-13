import Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { ModelInstance } from './types';
import type { UserAttributes } from './user';

export type StarredCommunityAttributes = {
  user_id: number;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;

  // associations
  User?: UserAttributes | UserAttributes['id'];
  Community?: CommunityAttributes;
};

export type StarredCommunityInstance =
  ModelInstance<StarredCommunityAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<StarredCommunityInstance> =>
  sequelize.define<StarredCommunityInstance>(
    'StarredCommunity',
    {
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
      community_id: { type: Sequelize.STRING, primaryKey: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'StarredCommunities',
      timestamps: true,
      underscored: true,
    },
  );
