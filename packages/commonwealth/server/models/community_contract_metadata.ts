import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityContractMetadataAttributes = {
  cct_id: string;
  slug: string;
  nickname: string;
  display_name: string;
  display_options: string;
};

export type CommunityContractTemplateInstance =
  ModelInstance<CommunityContractMetadataAttributes>;

export type CommunityContractMetadataStatic =
  ModelStatic<CommunityContractTemplateInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommunityContractMetadataStatic => {
  const CommunityContractMetadata = <CommunityContractMetadataStatic>(
    sequelize.define(
      'CommunityContractMetadata',
      {
        cct_id: { type: dataTypes.STRING, allowNull: false, primaryKey: true },
        slug: { type: dataTypes.STRING, allowNull: false },
        nickname: { type: dataTypes.STRING, allowNull: false },
        display_name: { type: dataTypes.STRING, allowNull: false },
        display_options: { type: dataTypes.STRING, allowNull: false },
      },
      {
        tableName: 'CommunityContractMetadat',
        underscored: true,
        timestamps: false,
      }
    )
  );

  return CommunityContractMetadata;
};
