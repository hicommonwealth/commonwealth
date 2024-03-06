import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { seedDb } from '../../src/test';

chai.use(chaiAsPromised);

describe('Comment lifecycle', () => {
  before(async () => {
    await seedDb();
  });

  after(async () => {
    await dispose()();
  });

  // TODO: Add comment tests
});
