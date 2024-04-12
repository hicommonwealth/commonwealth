import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
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
  dataTypes: typeof DataTypes,
): CommunityContractTemplateMetadataStatic => {
  const CommunityContractTemplateMetadata = <
    CommunityContractTemplateMetadataStatic
  >sequelize.define(
    'CommunityContractTemplateMetadata',
    {
      id: {
        type: dataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: { type: dataTypes.STRING, allowNull: false },
      nickname: { type: dataTypes.STRING, allowNull: true },
      display_name: { type: dataTypes.STRING, allowNull: false },
      display_options: {
        type: dataTypes.ENUM('0', '1', '2', '3'),
        allowNull: true,
      },
      enabled_by: { type: dataTypes.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: true },
      updated_at: { type: dataTypes.DATE, allowNull: true },
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
