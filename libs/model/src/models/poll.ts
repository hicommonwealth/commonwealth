import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { CommunityAttributes } from './community';
import type { ThreadAttributes } from './thread';
import type { ModelInstance, ModelStatic } from './types';
import type { VoteAttributes } from './vote';

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
  Thread?: ThreadAttributes;
  Chain?: CommunityAttributes;
  votes?: VoteAttributes[];
};

export type PollInstance = ModelInstance<PollAttributes>;
export type PollModelStatic = ModelStatic<PollInstance>;

export default (sequelize: Sequelize.Sequelize, dataTypes: typeof DataTypes) =>
  <PollModelStatic>sequelize.define<PollInstance>(
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
