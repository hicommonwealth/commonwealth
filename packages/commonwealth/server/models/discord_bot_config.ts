import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type DiscordBotConfigAttributes = {
  id: number;
  bot_id: string;
  chain_id: string;
  guild_id: string;
  snapshot_channel_id: string;
  verification_token: string;
  token_expiration: Date;
  verified: boolean;
};

export type DiscordBotConfigInstance =
  ModelInstance<DiscordBotConfigAttributes>;

export type DiscordBotConfigModelStatic = ModelStatic<DiscordBotConfigInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): DiscordBotConfigModelStatic => {
  const DiscordBotConfig = <DiscordBotConfigModelStatic>sequelize.define(
    'DiscordBotConfig',
    {
      id: {
        type: dataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      }, // autogenerated
      bot_id: { type: dataTypes.STRING, allowNull: true },
      chain_id: {
        type: dataTypes.STRING,
        allowNull: false,
      },
      guild_id: { type: dataTypes.STRING, allowNull: true },
      snapshot_channel_id: { type: dataTypes.STRING, allowNull: true },
      verification_token: { type: dataTypes.STRING, allowNull: true },
      token_expiration: { type: dataTypes.DATE, allowNull: true },
      verified: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      tableName: 'DiscordBotConfig',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  DiscordBotConfig.associate = (models) => {
    models.DiscordBotConfig.belongsTo(models.Community, {
      foreignKey: 'chain_id',
      targetKey: 'id',
      onDelete: 'CASCADE',
    });
  };

  return DiscordBotConfig;
};
