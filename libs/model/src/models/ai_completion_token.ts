import {
  AICompletionToken,
  AICompletionTokenCreation,
} from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type AICompletionTokenAttributes = z.infer<typeof AICompletionToken>;
export type AICompletionTokenCreationAttributes = z.infer<
  typeof AICompletionTokenCreation
>;

export type AICompletionTokenInstance =
  ModelInstance<AICompletionTokenAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<AICompletionTokenInstance> =>
  sequelize.define<
    AICompletionTokenInstance,
    AICompletionTokenCreationAttributes
  >(
    'AICompletionToken',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      token: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Communities',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      thread_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Threads',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      parent_comment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Comments',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'AICompletionTokens',
      underscored: false,
      indexes: [
        { fields: ['token'], unique: true },
        { fields: ['user_id'] },
        { fields: ['expires_at'] },
        { fields: ['used_at'] },
        { fields: ['thread_id'] },
      ],
    },
  );
