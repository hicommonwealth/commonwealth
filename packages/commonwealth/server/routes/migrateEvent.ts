import { success, TypedRequestBody, TypedResponse } from '../types';
import { AppError, ServerError } from '../util/errors';
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
  migrateAll: boolean;
  secret: string;
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
  const { migrateAll, secret, chain_id } = req.body;

  if (!process.env.AIRPLANE_SECRET || process.env.AIRPLANE_SECRET !== secret) {
    throw new AppError(MigrateEventErrors.Failed);
  }

  if (migrateAll) {
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
