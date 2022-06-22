import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type ChatMessageAttributes = {
  id?: number;
  address: string;
  message: string;
  chat_channel_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export type ChatMessageInstance = ModelInstance<ChatMessageAttributes> & {
}

export type ChatMessageModelStatic = ModelStatic<ChatMessageInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChatMessageModelStatic => {
  const ChatMessage = <ChatMessageModelStatic>sequelize.define('ChatMessage', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address: { type: dataTypes.STRING, allowNull: false },
    message: { type: dataTypes.TEXT, allowNull: false },
    chat_channel_id: { type: dataTypes.INTEGER, allowNull: false },
  }, {
    tableName: 'ChatMessages',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true,
  });

  ChatMessage.associate = (models) => {
    models.ChatMessage.belongsTo(models.ChatChannel)
  }

  return ChatMessage;
};
