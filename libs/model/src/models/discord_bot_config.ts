import { DiscordBotConfig } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type DiscordBotConfigAttributes = z.infer<typeof DiscordBotConfig>;

export type DiscordBotConfigInstance =
  ModelInstance<DiscordBotConfigAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<DiscordBotConfigInstance> =>
  sequelize.define<DiscordBotConfigInstance>(
    'DiscordBotConfig',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      guild_id: { type: Sequelize.STRING, allowNull: true },
      snapshot_channel_id: { type: Sequelize.STRING, allowNull: true },
      verification_token: { type: Sequelize.STRING, allowNull: true },
      token_expiration: { type: Sequelize.DATE, allowNull: true },
      verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'DiscordBotConfig',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
