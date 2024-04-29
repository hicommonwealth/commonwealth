import type * as Sequelize from 'sequelize';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

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

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): TemplateModelStatic => {
  const Template = <TemplateModelStatic>sequelize.define(
    'Template',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      abi_id: { type: dataTypes.INTEGER, allowNull: false },
      name: { type: dataTypes.STRING, allowNull: false },
      template: { type: dataTypes.JSONB, allowNull: false },
      created_by: { type: dataTypes.STRING, allowNull: true },
      description: { type: dataTypes.STRING, allowNull: true },
      created_for_community: { type: dataTypes.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: true },
      updated_at: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'Template',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );

  Template.associate = (models) => {
    models.Template.belongsTo(models.ContractAbi, {
      foreignKey: 'abi_id',
      targetKey: 'id',
    });
    models.Template.belongsTo(models.Community, {
      foreignKey: 'created_for_community',
      targetKey: 'id',
    });
  };

  return Template;
};
