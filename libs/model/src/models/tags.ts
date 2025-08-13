import { Tags } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod/v4';
import type { ModelInstance } from './types';

export type TagsInstance = ModelInstance<z.infer<typeof Tags>>;
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
    },
  );
