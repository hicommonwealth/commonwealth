import type { DataTypes, Model } from 'sequelize';
import * as Sequelize from 'sequelize';
import type {
  ChatMessageAttributes,
  ChatMessageInstance,
} from './chat_message';
import type { ModelStatic } from './types';

export interface ChatChannelAttributes {
  id?: number;
  name: string;
  chain_id: string;
  category: string;

  chat_messages?: ChatMessageAttributes[] | ChatMessageAttributes['id'][];
  created_at?: Date;
  updated_at?: Date;
}

export interface ChatChannelInstance
  extends Model<ChatChannelAttributes>,
    ChatChannelAttributes {
  getChatMessages: Sequelize.HasManyGetAssociationsMixin<ChatMessageInstance>;
}

export type ChatChannelModelStatic = ModelStatic<ChatChannelInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        type: Sequelize.STRING,
        allowNull: false,
        onDelete: 'CASCADE',
        references: {
          model: 'Chains',
          key: 'id',
        },
      },
      category: {
        type: Sequelize.STRING(255),
        allowNull: false,
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
    models.ChatChannel.belongsTo(models.Chain, {
      onDelete: 'CASCADE',
    });
  };
  return ChatChannel;
};
