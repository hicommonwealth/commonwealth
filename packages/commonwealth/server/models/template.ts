import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { SnapshotSpaceAttributes } from './snapshot_spaces';
import type { ModelInstance, ModelStatic } from './types';

export type TemplateAttributes = {
  id: number;
  abi_id: number;
  name: string;
  template: string; // TODO: Type this as an object to the schema spec??
  created_at?: Date;
  updated_at?: Date;
};

export type TemplateInstance = ModelInstance<TemplateAttributes>;

export type TemplateModelStatic = ModelStatic<TemplateInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): TemplateModelStatic => {
  const Template = <TemplateModelStatic>sequelize.define(
    'Template',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      abi_id: { type: dataTypes.INTEGER, allowNull: false },
      name: { type: dataTypes.STRING, allowNull: false },
      template: { type: dataTypes.JSONB, allowNull: false },
    },
    {
      tableName: 'Template',
      timestamps: false,
      underscored: true,
    }
  );

  Template.associate = (models) => {
    models.Template.belongsTo(models.ContractAbi, {
      foreignKey: 'abi_id',
      targetKey: 'id',
    });
  };

  return Template;
};
