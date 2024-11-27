import { XpLog } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type XpLogInstance = ModelInstance<z.infer<typeof XpLog>>;
export type XpLogModelStatic = Sequelize.ModelStatic<XpLogInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <XpLogModelStatic>sequelize.define<XpLogInstance>(
    'XpLog',
    {
      event_name: { type: Sequelize.STRING, primaryKey: true },
      event_created_at: { type: Sequelize.DATE, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
      xp_points: { type: Sequelize.INTEGER, allowNull: false },
      action_meta_id: { type: Sequelize.INTEGER, allowNull: true },
      creator_user_id: { type: Sequelize.INTEGER, allowNull: true },
      creator_xp_points: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      tableName: 'XpLogs',
      underscored: true,
    },
  );
