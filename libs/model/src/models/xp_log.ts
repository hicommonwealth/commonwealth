import { XpLog } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod/v4';
import type { ModelInstance } from './types';

export type XpLogInstance = ModelInstance<z.infer<typeof XpLog>>;
export type XpLogModelStatic = Sequelize.ModelStatic<XpLogInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <XpLogModelStatic>sequelize.define<XpLogInstance>(
    'XpLog',
    {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      action_meta_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      event_created_at: { type: Sequelize.DATE, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: true },
      xp_points: { type: Sequelize.INTEGER, allowNull: false },
      creator_user_id: { type: Sequelize.INTEGER, allowNull: true },
      creator_xp_points: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      tableName: 'XpLogs',
      underscored: true,
    },
  );
