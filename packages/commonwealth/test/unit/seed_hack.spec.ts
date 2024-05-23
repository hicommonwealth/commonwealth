import { dispose } from '@hicommonwealth/core';
import { models, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { e2eSeeder } from '../e2e/utils/e2eUtils';

describe('Hack to seed test db before other unit tests', () => {
  before(async () => {
    await tester.seedDb();
    await e2eSeeder();
  });
  after(async () => {
    await dispose()();
  });

  it('should seed', async () => {
    const communities = await models.Community.findAll();
    expect(communities.length).to.be.greaterThan(0);
    const collaborations = await models.Collaboration.findAll();
    expect(collaborations.length).to.be.greaterThan(0);
  });
});
