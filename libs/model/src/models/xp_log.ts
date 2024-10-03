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
      user_id: { type: Sequelize.INTEGER, primaryKey: true },
      created_at: { type: Sequelize.DATE, primaryKey: true },
      event_name: { type: Sequelize.STRING, primaryKey: true },
      xp_points: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      timestamps: false,
      tableName: 'XpLogs',
      underscored: true,
    },
  );
