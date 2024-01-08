import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
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

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommunityBannerModelStatic => {
  const CommunityBanner = <CommunityBannerModelStatic>sequelize.define(
    'CommunityBanner',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      banner_text: { type: dataTypes.TEXT, allowNull: false },
      community_id: { type: dataTypes.STRING, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'CommunityBanners',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    },
  );

  CommunityBanner.associate = (models) => {
    models.CommunityBanner.belongsTo(models.Community);
  };

  return CommunityBanner;
};
