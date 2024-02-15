import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';

describe('group lifecycle', () => {
  before(async () => {
    await tester.seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('should create group when none exists', () => {});

  it('should fail creation when group with same id found', () => {});

  it('should fail creation when community reached max number of groups allowed', () => {});

  it('should fail creation when sending invalid topics', () => {});
});
