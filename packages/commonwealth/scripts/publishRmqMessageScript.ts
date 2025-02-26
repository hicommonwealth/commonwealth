import { RascalExchanges } from '@hicommonwealth/adapters';

/*
For more information on any of these routes and their behaviour/return values check:
https://rawcdn.githack.com/rabbitmq/rabbitmq-server/v3.11.1/deps/rabbitmq_management/priv/www/api/index.html
 */

/**
 * FOR TESTING/SCRIPTING ONLY!
 * This function publishes a message containing the given data to the given exchange. In the event of a 400 Bad Request
 * error ensure ALL nested objects in the data object are stringified BEFORE calling this function.
 * @param rabbitMQUri The URI of the RabbitMQ Management API instance to connect to
 * @param exchangeName The name of the exchange to publish the message to
 * @param routingKey The routing key which defines what queue a message is routed to from the given exchange
 * @param data The object to publish (WARNING: all nested objects must be individually json stringified)
 * @returns {routed: boolean} If routed is false the message was not queued and if routed is true the message was queued
 */
export async function publishRmqMsg(
  rabbitMQUri: string,
  exchangeName: RascalExchanges,
  routingKey: string,
  data: unknown,
): Promise<{ routed: boolean }> {
  const publishBody = JSON.stringify({
    properties: { content_type: 'application/json' },
    routing_key: routingKey,
    payload: JSON.stringify(data),
    props: {
      content_type: 'application/json',
    },
    payload_encoding: 'string',
  });
  const publishResult = await fetch(
    `${rabbitMQUri}/exchanges/%2f/${exchangeName}/publish`,
    {
      method: 'post',
      body: publishBody,
      headers: { 'Content-Type': 'application/json' },
    },
  );
  return await publishResult.json();
}

async function publishRmqMessageScript() {
  const snapshot = {};

  const publishJson = await publishRmqMsg(
    'http://guest:guest@localhost:15672/api',
    RascalExchanges.MessageRelayer,
    'SnapshotProposalCreated',
    snapshot,
  );

  console.log(publishJson);
}

publishRmqMessageScript();
