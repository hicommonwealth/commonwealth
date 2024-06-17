import Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { ThreadAttributes } from './thread';
import type { ModelInstance } from './types';
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
  Community?: CommunityAttributes;
  votes?: VoteAttributes[];
};

export type PollInstance = ModelInstance<PollAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<PollInstance> =>
  sequelize.define<PollInstance>(
    'Poll',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      thread_id: { type: Sequelize.INTEGER, allowNull: false },
      community_id: { type: Sequelize.STRING, allowNull: false },

      prompt: { type: Sequelize.STRING, allowNull: false },
      options: { type: Sequelize.STRING, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: true },

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: true },
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
