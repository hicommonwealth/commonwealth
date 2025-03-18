import { logger } from '@hicommonwealth/core';
import { Op } from 'sequelize';
import { config } from '../config';
import { models } from '../database';

const log = logger(import.meta);

export function findActiveContestManager(
  contest_address: string,
  where: Record<string, any> = {},
) {
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
      ...where,
    },
  });
  if (!contestManager) {
    log.warn(`ContestManager not found for contest ${contest_address}`);
    return null;
  }
  return contestManager;
}
