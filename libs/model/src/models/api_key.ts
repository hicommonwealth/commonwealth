import { ApiKey } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ApiKeyAttributes = z.infer<typeof ApiKey>;

export type ApiKeyInstance = ModelInstance<ApiKeyAttributes>;

export type ApiKeyModelStatic = Sequelize.ModelStatic<ApiKeyInstance>;

export default (sequelize: Sequelize.Sequelize): ApiKeyModelStatic =>
  <ApiKeyModelStatic>sequelize.define<ApiKeyInstance>(
    'ApiKey',
    {
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
      hashed_api_key: { type: Sequelize.STRING, allowNull: false },
      salt: { type: Sequelize.STRING, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'ApiKeys',
      underscored: true,
    },
  );
