import Sequelize from 'sequelize';
import type { CommunityAttributes } from './community';
import type { ThreadAttributes } from './thread';
import type { ModelInstance, ModelStatic } from './types';

export type TopicAttributes = {
  id?: number;
  name: string;
  description?: string;
  community_id: string;
  featured_in_sidebar?: boolean;
  featured_in_new_post?: boolean;
  order?: number;
  channel_id?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
  default_offchain_template?: string;
  group_ids?: number[];
  telegram?: string;

  // associations
  community?: CommunityAttributes;
  threads?: ThreadAttributes[] | TopicAttributes['id'][];
};

export type TopicInstance = ModelInstance<TopicAttributes> & {
  // no mixins used
};

export type TopicModelStatic = ModelStatic<TopicInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <TopicModelStatic>sequelize.define<TopicInstance>(
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
