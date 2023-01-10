import { factory, formatFilename } from 'common-common/src/logging';
import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';

import type { DB } from '../../database/database';
import { runEntityMigrations } from '../../../scripts/migrateChainEntities';

const log = factory.getLogger(formatFilename(__filename));

enum MigrateEventErrors {
  Failed = 'Request Failed.',
  AllError = 'Failed to migrate all events.',
  MissingChainID = 'Missing chain_id.',
  ChainError = 'Failed to migrate chain events.',
}

const migrateEvent = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { secret, migrateAll, chain_id } = req.body;

  if (
    !process.env.AIRPLANE_SECRET ||
    !secret ||
    process.env.AIRPLANE_SECRET !== secret
  ) {
    return next(new AppError(MigrateEventErrors.Failed));
  }

  if (migrateAll && migrateAll === true) {
    try {
      runEntityMigrations();
    } catch (e) {
      return next(new AppError(MigrateEventErrors.AllError));
    }
    return res.json({
      status: 'Success',
      result: { message: 'Started migration for all events.' },
    });
  }

  if (!chain_id) {
    return next(new AppError(MigrateEventErrors.MissingChainID));
  }

  try {
    runEntityMigrations(chain_id);
  } catch (e) {
    log.error(e.message);
    return next(new AppError(MigrateEventErrors.ChainError));
  }

  return res.json({
    status: 'Success',
    result: { message: `Started migration for ${chain_id}.` },
  });
};

export default migrateEvent;
