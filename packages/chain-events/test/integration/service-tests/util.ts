import fetch from "node-fetch";
import {RABBITMQ_API_URI} from "../../../services/config";
import {RascalQueues, RascalExchanges, RascalRoutingKeys} from '../../../../common-common/src/rabbitmq/types';


/*
For more information on any of these routes and their behaviour/return values check:
https://rawcdn.githack.com/rabbitmq/rabbitmq-server/v3.11.1/deps/rabbitmq_management/priv/www/api/index.html
 */

/**
 * This function publishes a message containing the given data to the given exchange. In the event of a 400 Bad Request
 * error ensure ALL nested objects in the data object are stringified BEFORE calling this function.
 * @param exchangeName The name of the exchange to publish the message to
 * @param routingKey The routing key which defines what queue a message is routed to from the given exchange
 * @param data The object to publish (WARNING: all nested objects must be individually json stringified)
 * @returns {routed: boolean} If routed is false the message was not queued and if routed is true the message was queued
 */
export async function publishRmqMsg(
  exchangeName: RascalExchanges,
  routingKey: RascalRoutingKeys,
  data: any
): Promise<{routed: boolean}> {
  const publishBody = JSON.stringify({
    properties: {content_type: "application/json"},
    routing_key: routingKey,
    payload: JSON.stringify(data),
    props: {
      "content_type": "application/json"
    },
    payload_encoding: "string"
  });
  const publishResult = await fetch(`${RABBITMQ_API_URI}/exchanges/%2f/${exchangeName}/publish`, {
    method: 'post',
    body: publishBody,
    headers: {'Content-Type': 'application/json'}
  });
  return await publishResult.json();
}

/**
 * This function fetches queue stats for the given queue.
 * @param queueName
 */
export async function getQueueStats(queueName: RascalQueues): Promise<any> {
  let result = await fetch(`${RABBITMQ_API_URI}/queues/%2f/${queueName}`);
  return await result.json();
}

/**
 * This functions retrieves a number of messages from the specified RabbitMQ queue
 * @param queueName The name of the queue to retrieve messages from
 * @param requeue [Default true] A boolean variable indicating whether the message(s) should be left in the queue
 * @param numMessages The number of messages to fetch from the queue
 */
export async function getRmqMessage(
  queueName: RascalQueues,
  requeue = true,
  numMessages = 1
): Promise<any[]> {
  let body: any;
  if (requeue) body = {count: numMessages, ackmode: "ack_requeue_true", encoding: "auto"}
  else body = {count: numMessages, ackmode: "ack_requeue_false", encoding: "auto"}

  const result = await fetch(`${RABBITMQ_API_URI}/queues/%2f/${queueName}/get`, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  });
  return await result.json()
}
