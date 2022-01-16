import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface ChatMessageAttributes {
  id?: number;
  address: string;
  message: string;
  chat_channel_id;
  created_at?: Date;
  updated_at?: Date;
}

export interface ChatMessageInstance
extends Model<ChatMessageAttributes>, ChatMessageAttributes {

}

export type ChatMessageModelStatic = ModelStatic<ChatMessageInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChatMessageModelStatic => {
  const ChatMessage = <ChatMessageModelStatic>sequelize.define('ChatMessage', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    address: { type: dataTypes.STRING, allowNull: false, references: { model: 'Address', key: 'address' } },
    message: { type: dataTypes.TEXT, allowNull: false },
    chat_channel_id: { type: dataTypes.INTEGER, allowNull: false, references: { model: 'ChatChannel', key: 'id' } },
  }, {
    tableName: 'ChatMessages',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    timestamps: true,
    indexes: [
      { fields: ['created_at'] },
    ],
  });

  ChatMessage.associate = (models) => {
    models.ChatMessage.belongsTo(models.ChatChannel)
  }

  return ChatMessage;
};
