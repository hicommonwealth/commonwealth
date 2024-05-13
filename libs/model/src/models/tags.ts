import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type TagsAttributes = {
  id?: number;
  name: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
};

export type TagsInstance = ModelInstance<TagsAttributes>;

export type TagsModelStatic = Sequelize.ModelStatic<TagsInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <TagsModelStatic>sequelize.define<TagsInstance>(
    'Tags',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      tableName: 'Tags',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      defaultScope: {
        attributes: {
          exclude: ['created_at', 'updated_at'],
        },
      },
    },
  );
