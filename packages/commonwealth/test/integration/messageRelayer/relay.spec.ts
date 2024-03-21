import {
  Broker,
  schemas,
  successfulInMemoryBroker,
} from '@hicommonwealth/core';
import {
  DB,
  OutboxAttributes,
  insertOutbox,
  tester,
} from '@hicommonwealth/model';
import { expect } from 'chai';
import { QueryTypes } from 'sequelize';
import { relay } from '../../../server/workers/messageRelayer/relay';
import { testOutboxEvents } from './util';

describe('relay', () => {
  let models: DB;

  before(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    await tester.seedDb();
    await models.sequelize.query('DELETE FROM "Outbox";');
  });

  afterEach('Clean outbox', async () => {
    await models.sequelize.query('DELETE FROM "Outbox";');
  });

  it('Should relay a single event and update relayed column', async () => {
    await insertOutbox(models, [
      {
        name: 'test' as schemas.Events,
        payload: {},
        created_at: new Date('2024-01-02T00:00:00.000Z'),
      },
    ]);
    const numRelayed = await relay(successfulInMemoryBroker, models);
    expect(numRelayed).to.equal(1);
    const events = await models.sequelize.query<OutboxAttributes>(
      `SELECT * FROM "Outbox" WHERE relayed = true;`,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    expect(events.length).to.equal(1);
  });

  it('Should relay multiple events in order', async () => {
    const publishedEvents = [];
    const spyBroker: Broker = {
      ...successfulInMemoryBroker,
      publish: async (topic: string, event: any) => {
        publishedEvents.push(event.name);
        return true;
      },
    };
    await insertOutbox(models, testOutboxEvents);
    const numRelayed = await relay(spyBroker, models);
    expect(numRelayed).to.equal(3);
    const events = await models.sequelize.query<OutboxAttributes>(
      `SELECT * FROM "Outbox" WHERE relayed = true;`,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    console.log(publishedEvents);
    expect(events.length).to.equal(3);
    expect(publishedEvents[0]).to.equal('first');
    expect(publishedEvents[1]).to.equal('second');
    expect(publishedEvents[2]).to.equal('third');
  });

  it('should stop relaying if publish fails in order to preserve order', async () => {
    const publishedEvents = [];
    const spyBroker: Broker = {
      ...successfulInMemoryBroker,
      publish: async (topic: string, event: any) => {
        if (publishedEvents.length === 1) return false;
        publishedEvents.push(event.name);
        return true;
      },
    };
    await insertOutbox(models, testOutboxEvents);
    const numRelayed = await relay(spyBroker, models);
    expect(numRelayed).to.equal(1);
    expect(publishedEvents.length).to.equal(1);

    const relayedEvents = await models.sequelize.query<OutboxAttributes>(
      `SELECT * FROM "Outbox" WHERE relayed = true;`,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    expect(relayedEvents.length).to.equal(1);
    expect(publishedEvents.length).to.equal(1);
    expect(publishedEvents[0]).to.equal('first');

    const unrelayedEvents = await models.sequelize.query<OutboxAttributes>(
      `SELECT * FROM "Outbox" WHERE relayed = false;`,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    expect(unrelayedEvents.length).to.equal(2);
  });
});
