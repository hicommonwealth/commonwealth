import { Broker, successfulInMemoryBroker } from '@hicommonwealth/core';
import { DB, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { relay } from '../../../server/workers/messageRelayer/relay';
import { testOutboxEvents } from './util';

describe('relay', () => {
  let models: DB;

  before(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    await tester.bootstrap_testing(true);
  });

  afterEach('Clean outbox', async () => {
    await models.Outbox.truncate();
  });

  it('Should relay a single event and update relayed column', async () => {
    await models.Outbox.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event_name: 'test' as any,
      event_payload: {
        event_name: 'test',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    const numRelayed = await relay(successfulInMemoryBroker, models);
    expect(numRelayed).to.equal(1);
    const events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(events.length).to.equal(1);
  });

  it('Should relay multiple events in order', async () => {
    const publishedEvents = [];
    const spyBroker: Broker = {
      ...successfulInMemoryBroker,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/require-await
      publish: async (topic: string, event: any) => {
        publishedEvents.push(event.name);
        return true;
      },
    };
    await models.Outbox.bulkCreate(testOutboxEvents);
    const numRelayed = await relay(spyBroker, models);
    expect(numRelayed).to.equal(3);
    const events = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(events.length).to.equal(3);
    expect(publishedEvents[0]).to.equal('first');
    expect(publishedEvents[1]).to.equal('second');
    expect(publishedEvents[2]).to.equal('third');
  });

  it('should stop relaying if publish fails in order to preserve order', async () => {
    const publishedEvents = [];
    const spyBroker: Broker = {
      ...successfulInMemoryBroker,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/require-await
      publish: async (topic: string, event: any) => {
        if (publishedEvents.length === 1) return false;
        publishedEvents.push(event.name);
        return true;
      },
    };
    await models.Outbox.bulkCreate(testOutboxEvents);
    const numRelayed = await relay(spyBroker, models);
    expect(numRelayed).to.equal(1);
    expect(publishedEvents.length).to.equal(1);

    const relayedEvents = await models.Outbox.findAll({
      where: {
        relayed: true,
      },
    });
    expect(relayedEvents.length).to.equal(1);
    expect(publishedEvents.length).to.equal(1);
    expect(publishedEvents[0]).to.equal('first');

    const unrelayedEvents = await models.Outbox.findAll({
      where: {
        relayed: false,
      },
    });
    expect(unrelayedEvents.length).to.equal(2);
  });
});
