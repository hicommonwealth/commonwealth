import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type CommunityDirectoryTagsAttributes = {
  community_id: string;
  tag_id: number | null;
  selected_community_id: string | null;
  created_at?: Date;
  updated_at?: Date;
};

export type CommunityDirectoryTagsInstance =
  ModelInstance<CommunityDirectoryTagsAttributes>;

export type CommunityDirectoryTagsModelStatic =
  Sequelize.ModelStatic<CommunityDirectoryTagsInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommunityDirectoryTagsModelStatic>(
    sequelize.define<CommunityDirectoryTagsInstance>(
      'CommunityDirectoryTags',
      {
        community_id: {
          type: Sequelize.STRING,
          primaryKey: true,
          allowNull: false,
        },
        tag_id: { type: Sequelize.INTEGER, allowNull: true },
        selected_community_id: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
      },
      {
        timestamps: true,
        tableName: 'CommunityDirectoryTags',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        defaultScope: {
          attributes: {
            exclude: ['created_at', 'updated_at'],
          },
        },
      },
    )
  );
