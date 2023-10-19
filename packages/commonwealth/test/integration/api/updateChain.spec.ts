import { assert } from 'chai';
import { ServerChainsController } from '../../../server/controllers/server_chains_controller';
import { resetDatabase } from '../../util/resetDatabase';
import models from 'server/database';

describe('UpdateChain Tests', () => {
  before(async () => {
    await resetDatabase();
  });
});