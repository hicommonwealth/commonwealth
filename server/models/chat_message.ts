import * as Sequelize from 'sequelize';

export interface ChatMessageAttributes {
  id?: number;
  chain: string;
  address: string;
  text: string;
  room: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ChatMessageInstance
extends Sequelize.Instance<ChatMessageAttributes>, ChatMessageAttributes {

}

export interface ChatMessageModel
extends Sequelize.Model<ChatMessageInstance, ChatMessageAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ChatMessageModel => {
  const ChatMessage = sequelize.define<ChatMessageInstance, ChatMessageAttributes>('ChatMessage', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    address: { type: dataTypes.STRING, allowNull: false },
    text: { type: dataTypes.TEXT, allowNull: false },
    room: { type: dataTypes.STRING, allowNull: false },
  }, {
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['created_at'] },
    ],
  });

  return ChatMessage;
};
