import { models } from '@hicommonwealth/model';
import { z } from 'zod';
import { GraphileTask } from '../types';

const runDbMaintenance = async () => {
  await models.sequelize.query(`
      SELECT run_maintenance();
  `);
};

export const runDbMaintenanceTask: GraphileTask = {
  input: z.undefined(),
  fn: runDbMaintenance,
};
