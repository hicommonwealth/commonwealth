import { Model, DataTypes } from 'sequelize';
import * as Sequelize from 'sequelize';
import { ModelStatic } from './types';
import { ChatMessageAttributes, ChatMessageInstance } from './chat_message';

export interface ChatChannelAttributes {
  id?: number;
  name: string;
  chain_id: string;
  category: string;
  chat_messages?: ChatMessageAttributes[] | ChatMessageAttributes['id'][];
}

export interface ChatChannelInstance
  extends Model<ChatChannelAttributes>,
    ChatChannelAttributes {
  getChatMessages: Sequelize.HasManyGetAssociationsMixin<ChatMessageInstance>;
}

export type ChatChannelModelStatic = ModelStatic<ChatChannelInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChatChannelModelStatic => {
  const ChatChannel = <ChatChannelModelStatic>sequelize.define(
    'ChatChannel',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      chain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Chain',
          key: 'id',
        },
      },
      category: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'ChatChannels',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      timestamps: true,
    }
  );

  ChatChannel.associate = (models) => {
    models.ChatChannel.hasMany(models.ChatMessage, {
      foreignKey: 'chat_channel_id',
    });
  };
  return ChatChannel;
};
