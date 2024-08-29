console.log('LOADING src/models/profile_tags.ts START');
import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type ProfileTagsAttributes = {
  user_id: number;
  tag_id: number;
  created_at: Date;
  updated_at: Date;
};

export type ProfileTagsInstance = ModelInstance<ProfileTagsAttributes>;

export type ProfileTagsModelStatic = Sequelize.ModelStatic<ProfileTagsInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <ProfileTagsModelStatic>sequelize.define<ProfileTagsInstance>(
    'ProfileTags',
    {
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
      tag_id: { type: Sequelize.INTEGER, primaryKey: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      tableName: 'ProfileTags',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: ['created_at', 'updated_at'],
        },
      },
    },
  );

console.log('LOADING src/models/profile_tags.ts END');
