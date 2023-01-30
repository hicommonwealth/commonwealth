import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityContractTemplateAttributes = {
  id: number;
  community_id: string;
  contract_id: number;
  template_id: number;
};

export type CommunityContractTemplateInstance =
  ModelInstance<CommunityContractTemplateAttributes>;

export type CommunityContractTemplateStatic =
  ModelStatic<CommunityContractTemplateInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): CommunityContractTemplateStatic => {
  const CommunityContractTemplate = <CommunityContractTemplateStatic>(
    sequelize.define(
      'CommunityContractTemplate',
      {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        community_id: { type: dataTypes.STRING, allowNull: false },
        contract_id: { type: dataTypes.INTEGER, allowNull: false },
        template_id: {
          type: dataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
      },
      {
        tableName: 'CommunityContractTemplate',
        underscored: true,
        timestamps: false,
      }
    )
  );

  return CommunityContractTemplate;
};
