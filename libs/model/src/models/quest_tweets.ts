import { QuestTweet } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type QuestTweetInstance = ModelInstance<z.infer<typeof QuestTweet>>;
export type QuestTweetModelStatic = Sequelize.ModelStatic<QuestTweetInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <QuestTweetModelStatic>sequelize.define<QuestTweetInstance>(
    'QuestTweet',
    {
      tweet_id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      quest_action_meta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      retweet_cap: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      like_cap: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      replies_cap: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      num_likes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      num_retweets: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      num_replies: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
      tableName: 'QuestTweets',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
