import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type CommunityImagesAttributes = {
  id?: string;
  community_id?: string;
  image_url?: string;
  creator_address?: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CommunityImagesInstance = ModelInstance<CommunityImagesAttributes>;

export type CommunityImagesModelStatic = ModelStatic<CommunityImagesInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommunityImagesModelStatic => {
  const CommunityImages = <CommunityImagesModelStatic>sequelize.define(
    'CommunityImages',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      creator_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    { timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' }
  );

  CommunityImages.associate = (models) => {
    models.CommunityImages.belongsTo(models.Chain, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return CommunityImages;
};
