import chai from 'chai';
import {ServiceConsumer} from "common-common/src/ServiceConsumer";
import {getQueueStats, publishRmqMsg} from "common-common/src/rabbitmq/util";
import {
  RascalExchanges,
  RascalQueues,
  RascalRoutingKeys, RmqCENotificationCUD, RmqEntityCUD
} from "common-common/src/rabbitmq";
import {v4 as uuidv4} from 'uuid';
import * as AaveTypes from "chain-events/src/chains/aave/types";
import {EventKind, ITransfer} from "chain-events/src/chains/aave/types";
import {CWEvent, SupportedNetwork} from "chain-events/src";
import {ChainEventAttributes} from "chain-events/services/database/models/chain_event";
import {setupCommonwealthConsumer} from "../../server/CommonwealthConsumer/CommonwealthConsumer";
import {RABBITMQ_API_URI} from "../../server/config";
import models from "../../server/database";


const {expect} = chai;

describe("Tests for the commonwealth-app consumer", () => {
  let serviceConsumer: ServiceConsumer;

  beforeEach(async () => {
    const preQueueStats = await getQueueStats(RABBITMQ_API_URI, RascalQueues.ChainEvents);
    expect(preQueueStats.consumers).to.equal(0, "Ensure all other RabbitMQ connections are inactive");

    serviceConsumer = await setupCommonwealthConsumer();

    // api refreshes every 5 seconds so ensure ample time is given
    // await new Promise(resolve => setTimeout(resolve, 10000));
  });

  afterEach(async () => {
    await serviceConsumer.shutdown();
    // api refreshes every 5 seconds so ensure ample time is given
    await new Promise(resolve => setTimeout(resolve, 10000));
  });

  it("Should process chain-event-type messages from the ChainEventTypeCUD queue", async () => {
    const cetCUD = {
      chainEventTypeId: uuidv4(),
      cud: 'create'
    }

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.CUD,
      RascalRoutingKeys.ChainEventTypeCUD,
      cetCUD
    );

    // ensure the event was properly published
    expect(publishJson.routed, "Failed to publish message").to.be.true;

    // give time for the consumer to process the message
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dbResult = await models.ChainEventType.findOne({
      where: {
        id: cetCUD.chainEventTypeId
      }
    });
    expect(dbResult).to.not.be.null;

    await models.ChainEventType.destroy({
      where: {
        id: cetCUD.chainEventTypeId
      }
    });
  });

  it("Should process chain-event-notification messages from the CENotificationsCUD queue", async () => {
    const ceData: ITransfer = {
      kind: EventKind.Transfer,
      tokenAddress: uuidv4(),
      from: uuidv4(),
      to: uuidv4(),
      amount: uuidv4()
    }
    // // create a fake aave-transfer event
    const cwEvent: CWEvent<AaveTypes.IEventData> = {
      blockNumber: Math.floor(Math.random() * 1000000),
      data: ceData,
      network: SupportedNetwork.Aave,
      chain: 'aave'
    }

    const cet = {
      id: `${cwEvent.chain}-${ceData.kind}`,
      chain: cwEvent.chain,
      event_network: cwEvent.network,
      event_name: ceData.kind,
      queued: -1
    }

    const maxCeId: number = await models.Notification.max('chain_event_id');
    if (!maxCeId) throw new Error("Failed to get max chain-event notification id")

    const chainEvent: ChainEventAttributes = {
      id: maxCeId + 1,
      chain_event_type_id: cet.id,
      block_number: cwEvent.blockNumber,
      event_data: ceData,
      queued: -1,
      ChainEventType: cet
    }

    const ceNotifCUD: RmqCENotificationCUD.RmqMsgType = {
      ChainEvent: chainEvent,
      event: cwEvent,
      cud: 'create'
    }

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.CUD,
      RascalRoutingKeys.ChainEventNotificationsCUD,
      ceNotifCUD
    );
    expect(publishJson.routed, "Failed to publish message").to.be.true;

    // give time for the consumer to process the message
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dbResult = await models.Notification.findOne({
      where: {
        chain_event_id: chainEvent.id
      }
    });
    expect(dbResult).to.not.be.null;

    await models.Notification.destroy({
      where: {
        chain_event_id: chainEvent.id
      }
    });
  });

  it("Should process chain-entity messages from the ChainEntityCUD queue", async () => {
    const maxEntityId: number = await models.ChainEntityMeta.max('ce_id');
    if (!maxEntityId) throw new Error("Failed to get max entity id");

    const entity: RmqEntityCUD.RmqMsgType = {
      ce_id: maxEntityId + 1,
      chain_id: 'aave',
      cud: 'create',
      entity_type_id: '123',
    }

    const publishJson = await publishRmqMsg(
      RABBITMQ_API_URI,
      RascalExchanges.CUD,
      RascalRoutingKeys.ChainEntityCUD,
      entity
    );
    expect(publishJson.routed, "Failed to publish message").to.be.true;

    // give time for the consumer to process the message
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dbResult = models.ChainEntityMeta.findOne({
      where: {
        ce_id: entity.ce_id
      }
    });
    expect(dbResult).to.not.be.null;

    await models.ChainEntityMeta.destroy({
      where: {
        ce_id: entity.ce_id
      }
    });
  });
})
