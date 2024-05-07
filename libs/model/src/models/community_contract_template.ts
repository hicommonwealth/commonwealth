import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { ModelInstance, ModelStatic } from './types';

export type CommunityContractTemplateAttributes = {
  id: number;
  community_contract_id: number;
  cctmd_id: number;
  template_id: number;
};

export type CommunityContractTemplateInstance =
  ModelInstance<CommunityContractTemplateAttributes>;

export type CommunityContractTemplateStatic =
  ModelStatic<CommunityContractTemplateInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <CommunityContractTemplateStatic>(
    sequelize.define<CommunityContractTemplateInstance>(
      'CommunityContractTemplate',
      {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        community_contract_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        cctmd_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        template_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
      },
      {
        tableName: 'CommunityContractTemplate',
        underscored: true,
        timestamps: false,
      },
    )
  );
