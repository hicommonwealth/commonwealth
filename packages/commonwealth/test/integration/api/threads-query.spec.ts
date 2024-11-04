/* eslint-disable @typescript-eslint/no-unused-vars */
import { dispose } from '@hicommonwealth/core';
import {
  ThreadAttributes,
  getThreadSearchVector,
  tester,
  type DB,
} from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { Optional } from 'sequelize';
import { NullishPropertiesOf } from 'sequelize/lib/utils';
import { afterAll, beforeAll, describe, test } from 'vitest';

chai.use(chaiHttp);
const { expect } = chai;

describe('Thread queries', () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('query_thread_through_collaborations', async () => {
    const chain = await models.Community.findOne();
    // @ts-expect-error StrictNullChecks
    expect(chain.id).to.not.be.null;
    const address = (
      await models.Address.findOrCreate({
        where: {
          address: 'JhgYcbJOdWHLVFHJKLPhC12',
          // @ts-expect-error StrictNullChecks
          community_id: chain.id,
          verification_token: 'fgdfgd',
        },
      })
    )[0];
    expect(address.id).to.not.be.null;
    expect(address.id).to.be.greaterThan(0);
    const thread = (
      await models.Thread.findOrCreate({
        where: {
          community_id: chain!.id,
          address_id: address.id,
          title: 'title',
          kind: 'kind',
          stage: 'stage',
          body: '',
        },
        defaults: {
          search: getThreadSearchVector('title', ''),
        } as unknown as Optional<
          ThreadAttributes,
          NullishPropertiesOf<ThreadAttributes>
        >,
      })
    )[0];
    expect(thread.id).to.be.greaterThan(0);
    expect(thread.address_id).to.to.be.greaterThan(0);
    const collaboration = await models.Collaboration.findOrCreate({
      where: {
        address_id: thread.address_id,
        thread_id: thread.id,
      },
    });
    const threads = await models.Thread.findAll({
      where: { id: thread.id },
      include: [
        {
          model: models.Address,
          as: 'Address',
        },
        {
          model: models.Address,
          as: 'collaborators',
          through: { where: { address_id: address.id } },
        },
        {
          model: models.Topic,
          as: 'topic',
        },
      ],
      order: [['created_at', 'DESC']],
    });
    expect(threads).to.not.be.null;
    expect(threads[0].id).to.equal(thread.id);
    // @ts-expect-error StrictNullChecks
    expect(threads[0].Address.id).to.not.be.null;
    expect(threads).length.above(0);
    expect(threads[0].collaborators).length.above(0);
    // @ts-expect-error StrictNullChecks
    threads[0].collaborators.map(({ id }) => {
      expect(id).to.equal(address.id);
    });
  });
});
