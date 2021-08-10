import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface ChatMessageAttributes {
  chain: string;
  address: string;
  text: string;
  room: string;
  id?: number;
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
    chain: { type: dataTypes.STRING, allowNull: false },
    address: { type: dataTypes.STRING, allowNull: false },
    text: { type: dataTypes.TEXT, allowNull: false },
    room: { type: dataTypes.STRING, allowNull: false },
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

  return ChatMessage;
};
