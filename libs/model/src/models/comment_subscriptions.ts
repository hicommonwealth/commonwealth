import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type CommentSubscriptionAttributes = z.infer<
  typeof schemas.entities.CommentSubscription
>;

export type CommentSubscriptionInstance =
  ModelInstance<CommentSubscriptionAttributes>;
export type CommentSubscriptionModelStatic =
  ModelStatic<CommentSubscriptionInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): CommentSubscriptionModelStatic => {
  const CommentSubscription = <CommentSubscriptionModelStatic>(
    sequelize.define<CommentSubscriptionInstance>(
      'CommentSubscriptions',
      {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: dataTypes.INTEGER, allowNull: false },
        comment_id: { type: dataTypes.INTEGER, allowNull: false },
        created_at: {
          type: dataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: dataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'CommentSubscriptions',
        underscored: false,
        indexes: [{ fields: ['user_id', 'comment_id'], unique: true }],
      },
    )
  );

  CommentSubscription.associate = (models) => {
    CommentSubscription.belongsTo(models.User, {
      foreignKey: 'user_id',
    });
    CommentSubscription.belongsTo(models.Comment, {
      foreignKey: 'comment_id',
    });
  };
  return CommentSubscription;
};
