import { Topic } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ChainNodeAttributes } from './chain_node';
import type { CommunityAttributes } from './community';
import type { ThreadAttributes } from './thread';
import type { ModelInstance } from './types';

export type TopicAttributes = z.infer<typeof Topic> & {
  // associations
  community?: CommunityAttributes;
  threads?: ThreadAttributes[];
  ChainNode?: ChainNodeAttributes;
  featured_in_sidebar?: boolean;
  featured_in_new_post?: boolean;
  group_ids?: number[];
  default_offchain_template?: string | null;
};
export type TopicInstance = ModelInstance<TopicAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<TopicInstance> =>
  sequelize.define<TopicInstance>(
    'Topic',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      featured_in_sidebar: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      featured_in_new_post: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      community_id: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      archived_at: { type: Sequelize.DATE, allowNull: true },
      order: { type: Sequelize.INTEGER, allowNull: true },
      default_offchain_template: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      channel_id: { type: Sequelize.STRING, allowNull: true },
      group_ids: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false,
        defaultValue: [],
      },
      telegram: { type: Sequelize.STRING, allowNull: true },
      weighted_voting: { type: Sequelize.STRING, allowNull: true },
      chain_node_id: { type: Sequelize.INTEGER, allowNull: true },
      token_address: { type: Sequelize.STRING, allowNull: true },
      token_symbol: { type: Sequelize.STRING, allowNull: true },
      vote_weight_multiplier: { type: Sequelize.FLOAT, allowNull: true },
      thread_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Topics',
      underscored: true,
      paranoid: true,
      defaultScope: {
        attributes: {
          exclude: ['created_at', 'updated_at', 'deleted_at'],
        },
      },
    },
  );
