import * as schemas from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod/v4';
import type { ModelInstance } from './types';

export type CommunityGoalMetaAttributes = z.infer<
  typeof schemas.CommunityGoalMeta
>;
export type CommunityGoalMetaInstance =
  ModelInstance<CommunityGoalMetaAttributes>;

export const CommunityGoalMeta = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommunityGoalMetaInstance> =>
  sequelize.define<CommunityGoalMetaInstance>(
    'CommunityGoalMeta',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      target: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      tableName: 'CommunityGoalMetas',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );

export type CommunityGoalReachedAttributes = z.infer<
  typeof schemas.CommunityGoalReached
>;
export type CommunityGoalReachedInstance =
  ModelInstance<CommunityGoalReachedAttributes>;

export const CommunityGoalReached = (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommunityGoalReachedInstance> =>
  sequelize.define<CommunityGoalReachedInstance>(
    'CommunityGoalReached',
    {
      community_goal_meta_id: { type: Sequelize.INTEGER, primaryKey: true },
      community_id: { type: Sequelize.STRING, primaryKey: true },
      reached_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
      tableName: 'CommunityGoalReached',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: false,
    },
  );
