import Sequelize from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityBannerAttributes = {
  id?: number;
  banner_text: string;
  community_id: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CommunityBannerInstance = ModelInstance<CommunityBannerAttributes>;

export type CommunityBannerModelStatic = ModelStatic<CommunityBannerInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommunityBannerModelStatic>sequelize.define<CommunityBannerInstance>(
    'CommunityBanner',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      banner_text: { type: Sequelize.TEXT, allowNull: false },
      community_id: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'CommunityBanners',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );
