import { TaskPayloads, models } from '@hicommonwealth/model';

const runDbMaintenance = async () => {
  await models.sequelize.query(`
      SELECT run_maintenance();
  `);
};

export const runDbMaintenanceTask = {
  input: TaskPayloads.RunDbMaintenance,
  fn: runDbMaintenance,
};
