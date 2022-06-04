import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type CommunityBannerAttributes = {
  id?: number;
  banner_text: string;
  chain_id: string;
  created_at?: Date;
  updated_at?: Date;
}

export type CommunityBannerInstance = ModelInstance<CommunityBannerAttributes> & {
}

export type CommunityBannerModelStatic = ModelStatic<CommunityBannerInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommunityBannerModelStatic => {
  const CommunityBanner = <CommunityBannerModelStatic>sequelize.define('CommunityBanner', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    banner_text: { type: dataTypes.TEXT, allowNull: false },
    chain_id: { type: dataTypes.STRING, allowNull: false },
  }, {
    tableName: 'CommunityBanners',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true,
  });

  CommunityBanner.associate = (models) => {
    models.CommunityBanner.belongsTo(models.Chain)
  }

  return CommunityBanner;
};
