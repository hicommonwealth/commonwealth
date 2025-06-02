import { FindOptions, Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';

export async function findActiveContestManager(
  contest_address: string,
  {
    include,
  }: {
    include?: FindOptions<typeof models.ContestManager>['include'];
  } = {
    include: [],
  },
) {
  return await models.ContestManager.findOne({
    where: {
      contest_address,
      environment: config.APP_ENV,
      cancelled: {
        [Op.not]: true,
      },
      ended: {
        [Op.not]: true,
      },
    },
    include,
  });
}
