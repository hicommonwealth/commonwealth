import { factory, formatFilename } from 'common-common/src/logging';
import { success, TypedRequestBody, TypedResponse } from '../types';
import { AppError } from 'common-common/src/errors';
import { DB } from '../database';
import {
  runEntityMigrations,
} from '../scripts/migrateChainEntities';

const log = factory.getLogger(formatFilename(__filename));

enum MigrateEventErrors {
  Failed = 'Request Failed.',
  AllError = 'Failed to migrate all events.',
  MissingChainID = 'Missing chain_id.',
  ChainError = 'Failed to migrate chain events.',
}

type migrateEventReq = {
  secret: string;
  migrateAll?: boolean;
  chain_id?: string;
};

type migrateEventResp = {
  message: string;
};

const migrateEvent = async (
  models: DB,
  req: TypedRequestBody<migrateEventReq>,
  res: TypedResponse<migrateEventResp>
) => {
  const { secret, migrateAll, chain_id } = req.body;

  if (
    !process.env.AIRPLANE_SECRET ||
    !secret ||
    process.env.AIRPLANE_SECRET !== secret
  ) {
    throw new AppError(MigrateEventErrors.Failed);
  }

  if (migrateAll && migrateAll === true) {
    try {
      migrateChainEntities();
    } catch (e) {
      throw new AppError(MigrateEventErrors.AllError);
    }
    return success(res, { message: 'Started migration for all events.' });
  }

  if (!chain_id) {
    throw new AppError(MigrateEventErrors.MissingChainID);
  }

  try {
    migrateChainEntity(chain_id);
  } catch (e) {
    log.error(e.message);
    throw new AppError(MigrateEventErrors.ChainError);
  }

  return success(res, { message: `Started migration for ${chain_id}.` });
};

export default migrateEvent;
