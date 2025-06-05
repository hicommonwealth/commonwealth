import { QuestTweet } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod/v4';
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
      tweet_url: {
        type: Sequelize.STRING,
        allowNull: false,
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
      like_xp_awarded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      reply_xp_awarded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      retweet_xp_awarded: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
