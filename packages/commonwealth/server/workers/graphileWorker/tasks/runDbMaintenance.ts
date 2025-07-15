import { models } from '@hicommonwealth/model/db';
import { TaskPayloads } from '@hicommonwealth/model/services';

const runDbMaintenance = async () => {
  await models.sequelize.query(`
      SELECT run_maintenance();
  `);
};

export const runDbMaintenanceTask = {
  input: TaskPayloads.RunDbMaintenance,
  fn: runDbMaintenance,
};
