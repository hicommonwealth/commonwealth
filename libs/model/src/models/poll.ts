import type * as Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { ThreadAttributes } from './thread';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type PollAttributes = {
  id: number;
  community_id: string;
  thread_id: number;
  prompt: string;
  options: string;
  ends_at: Date;

  created_at?: Date;
  updated_at?: Date;
  last_commented_on?: Date;

  // associations
  Thread: ThreadAttributes;
  Chain: CommunityAttributes;
};

export type PollInstance = ModelInstance<PollAttributes>;
export type PollModelStatic = ModelStatic<PollInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): PollModelStatic => {
  const Poll = <PollModelStatic>sequelize.define(
    'Poll',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: dataTypes.INTEGER, allowNull: false },
      community_id: { type: dataTypes.STRING, allowNull: false },

      prompt: { type: dataTypes.STRING, allowNull: false },
      options: { type: dataTypes.STRING, allowNull: false },
      ends_at: { type: dataTypes.DATE, allowNull: true },

      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: true },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Polls',
      indexes: [{ fields: ['thread_id'] }, { fields: ['community_id'] }],
    },
  );

  Poll.associate = (models) => {
    models.Poll.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
      targetKey: 'id',
    });
    models.Poll.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.Poll.hasMany(models.Vote, {
      foreignKey: 'poll_id',
      as: 'votes',
      onDelete: 'CASCADE',
    });
  };

  return Poll;
};
