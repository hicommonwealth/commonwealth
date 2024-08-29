import { ProfileTags } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ProfileTagsInstance = ModelInstance<z.infer<typeof ProfileTags>>;

export type ProfileTagsModelStatic = Sequelize.ModelStatic<ProfileTagsInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <ProfileTagsModelStatic>sequelize.define<ProfileTagsInstance>(
    'ProfileTags',
    {
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
      tag_id: { type: Sequelize.INTEGER, primaryKey: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      tableName: 'ProfileTags',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: ['created_at', 'updated_at'],
        },
      },
    },
  );
