import Sequelize from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type TemplateAttributes = {
  id: number;
  abi_id: number;
  name: string;
  template: string; // TODO: Type this as an object to the schema spec??
  created_by?: string;
  description?: string;
  created_for_community?: string;

  created_at?: Date;
  updated_at?: Date;
};

export type TemplateInstance = ModelInstance<TemplateAttributes>;

export type TemplateModelStatic = ModelStatic<TemplateInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <TemplateModelStatic>sequelize.define<TemplateInstance>(
    'Template',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      abi_id: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      template: { type: Sequelize.JSONB, allowNull: false },
      created_by: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.STRING, allowNull: true },
      created_for_community: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
      tableName: 'Template',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
