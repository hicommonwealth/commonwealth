import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { ModelInstance, ModelStatic } from './types';

export type CommunityContractTemplateMetadataAttributes = {
  id: number;
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
  enabled_by?: string;

  created_at?: Date;
  updated_at?: Date;
};

export type CommunityContractTemplateMetadataInstance =
  ModelInstance<CommunityContractTemplateMetadataAttributes>;

export type CommunityContractTemplateMetadataStatic =
  ModelStatic<CommunityContractTemplateMetadataInstance>;

export default (
  sequelize: Sequelize.Sequelize,
): CommunityContractTemplateMetadataStatic => {
  const CommunityContractTemplateMetadata = <
    CommunityContractTemplateMetadataStatic
  >sequelize.define(
    'CommunityContractTemplateMetadata',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: { type: Sequelize.STRING, allowNull: false },
      nickname: { type: Sequelize.STRING, allowNull: true },
      display_name: { type: Sequelize.STRING, allowNull: false },
      display_options: {
        type: Sequelize.ENUM('0', '1', '2', '3'),
        allowNull: true,
      },
      enabled_by: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
      tableName: 'CommunityContractTemplateMetadata',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );

  return CommunityContractTemplateMetadata;
};
