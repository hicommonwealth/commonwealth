import { CommentVersionHistory } from '@hicommonwealth/schemas';
import { MAX_TRUNCATED_CONTENT_LENGTH } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { CommentAttributes } from './comment';
import type { ModelInstance } from './types';
import { beforeValidateBodyHook } from './utils';

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
      body: {
        type: Sequelize.STRING(MAX_TRUNCATED_CONTENT_LENGTH),
        allowNull: false,
      },
      timestamp: { type: Sequelize.DATE, allowNull: false },
      content_url: { type: Sequelize.STRING, allowNull: true },
    },
    {
      tableName: 'CommentVersionHistories',
      timestamps: false,
      indexes: [{ fields: ['comment_id'] }],
      hooks: {
        beforeValidate(instance: CommentVersionHistoryInstance) {
          beforeValidateBodyHook(instance);
        },
      },
    },
  );
