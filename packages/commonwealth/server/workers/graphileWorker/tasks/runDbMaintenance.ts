import { GraphileTask, TaskPayloads, models } from '@hicommonwealth/model';

const runDbMaintenance = async () => {
  await models.sequelize.query(`
      SELECT run_maintenance();
  `);
};

export const runDbMaintenanceTask: GraphileTask = {
  input: TaskPayloads.RunDbMaintenance,
  fn: runDbMaintenance,
};
