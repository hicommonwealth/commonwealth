console.log('LOADING src/models/comment_version_history.ts START');
import { CommentVersionHistory } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { CommentAttributes } from './comment';
import type { ModelInstance } from './types';

export type CommentVersionHistoryAttributes = z.infer<
  typeof CommentVersionHistory
> & {
  // associations
  Comment?: CommentAttributes;
};

export type CommentVersionHistoryInstance =
  ModelInstance<CommentVersionHistoryAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommentVersionHistoryInstance> =>
  sequelize.define<CommentVersionHistoryInstance>(
    'CommentVersionHistory',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      comment_id: { type: Sequelize.INTEGER, allowNull: false },
      text: { type: Sequelize.TEXT, allowNull: false },
      timestamp: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'CommentVersionHistories',
      timestamps: false,
      indexes: [{ fields: ['comment_id'] }],
    },
  );

console.log('LOADING src/models/comment_version_history.ts END');
