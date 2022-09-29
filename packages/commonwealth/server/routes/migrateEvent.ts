import { success, TypedRequestBody, TypedResponse } from '../types';
import { AppError } from '../util/errors';
import { DB } from '../database';
import {
  migrateChainEntities,
  migrateChainEntity,
} from '../scripts/migrateChainEntities';

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
      await migrateChainEntities();
    } catch (e) {
      throw new AppError(MigrateEventErrors.AllError);
    }
    return success(res, { message: 'Migrated all events.' });
  }

  if (!chain_id) {
    throw new AppError(MigrateEventErrors.MissingChainID);
  }

  try {
    await migrateChainEntity(chain_id);
  } catch (e) {
    throw new AppError(MigrateEventErrors.ChainError);
  }

  return success(res, { message: 'Migrated chain events.' });
};

export default migrateEvent;
