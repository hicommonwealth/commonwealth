import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';

export function findActiveContestManager(contest_address: string) {
  const contestManager = models.ContestManager.findOne({
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
  });
  if (!contestManager) {
    return null;
  }
  return contestManager;
}
