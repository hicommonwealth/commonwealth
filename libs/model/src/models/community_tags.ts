import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type CommunityTagsAttributes = {
  id?: number;
  community_id: string;
  tag_id: number;
  created_at?: Date;
  updated_at?: Date;
};

export type CommunityTagsInstance = ModelInstance<CommunityTagsAttributes>;

export type CommunityTagsModelStatic =
  Sequelize.ModelStatic<CommunityTagsInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommunityTagsModelStatic>sequelize.define<CommunityTagsInstance>(
    'CommunityTags',
    {
      community_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      tag_id: { type: Sequelize.INTEGER, primaryKey: true, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      tableName: 'CommunityTags',
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
