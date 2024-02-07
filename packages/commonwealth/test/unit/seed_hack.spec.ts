import { dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import { expect } from 'chai';

describe('Hack to seed test db before other unit tests', () => {
  before(async () => {
    await tester.seedDb();
  });
  after(async () => {
    await dispose()();
  });

  it('should seed', async () => {
    const { models } = await import('@hicommonwealth/model');
    const communities = await models.Community.findAll();
    expect(communities.length).to.be.greaterThan(0);
  });
});
