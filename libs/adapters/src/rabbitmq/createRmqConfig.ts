import { config as EnvConfig } from '@hicommonwealth/adapters';
import {
  EventSchemas,
  EventsHandlerMetadata,
  outboxEvents,
} from '@hicommonwealth/core';
import {
  BindingConfig,
  BrokerConfig,
  ConnectionConfig,
  QueueConfig,
} from 'rascal';

export enum RascalExchanges {
  DeadLetter = 'DeadLetterExchange',
  MessageRelayer = 'MessageRelayerExchange',
}

type Consumers =
  | {
      consumer: () => EventsHandlerMetadata<EventSchemas>;
      overrides: Record<string, string | null | undefined>;
    }
  | (() => EventsHandlerMetadata<EventSchemas>);

/**
 * Generates the RabbitMQ configuration on the fly given a set of policies
 * and/or projections. Queues will be automatically generated for each
 * policy/projection with bindings for each event in the input. Overrides can
 * be used to implement custom routing keys. If a custom routing key is set to
 * NULL then a routing/binding key for the corresponding handler in the policy
 * will NOT be created.
 *
 * @param rabbitMqUri
 * @param map
 */
export function createRmqConfig({
  rabbitMqUri,
  map,
}: {
  rabbitMqUri: string;
  // TODO: @Roger - add types so that override keys are a partial record of consumer input type
  map: Array<Consumers>;
}) {
  let vhost: string, purge: boolean;

  if (rabbitMqUri.includes('localhost') || rabbitMqUri.includes('127.0.0.1')) {
    vhost = '/';
    purge = !EnvConfig.BROKER.DISABLE_LOCAL_QUEUE_PURGE;
  } else {
    const count = (rabbitMqUri.match(/\//g) || []).length;
    if (count == 3) {
      // this matches for a production URL
      const res = rabbitMqUri.split('/');
      vhost = res[res.length - 1];
      purge = false;
    } else {
      throw new Error(
        "Can't create Rascal RabbitMQ Config with an invalid URI!",
      );
    }
  }

  const queueConfig = {
    assert: true,
    purge: purge,
  };
  const deadLetterRoutingKey = 'DeadLetter';
  const exchangeConfig = {
    assert: true,
    options: {
      durable: true,
    },
  };

  const deadLetterQueue = 'DeadLetterQueue';
  const config: BrokerConfig = {
    vhosts: {
      [vhost]: {
        connection: <ConnectionConfig>rabbitMqUri,
        exchanges: {
          [RascalExchanges.DeadLetter]: {
            ...exchangeConfig,
          },
          [RascalExchanges.MessageRelayer]: {
            type: 'topic',
            ...exchangeConfig,
          },
        },
        queues: {
          [deadLetterQueue]: {
            ...queueConfig,
          },
        },
        bindings: {
          DeadLetterBinding: {
            source: RascalExchanges.DeadLetter,
            destination: deadLetterQueue,
            destinationType: 'queue',
            bindingKey: deadLetterRoutingKey,
          },
        },
        publications: {
          MessageRelayer: {
            exchange: RascalExchanges.MessageRelayer,
            confirm: true,
            options: {
              persistent: true,
            },
          },
        },
        subscriptions: {},
      },
    },
  };

  for (const item of map) {
    let consumer,
      overrides: Record<string, string | null | undefined> | undefined;
    if (typeof item === 'function') consumer = item;
    else {
      consumer = item.consumer;
      overrides = item.overrides;
    }

    const consumerName = consumer.name;
    const queue = `${consumerName}Queue`;
    const queues = config.vhosts![vhost].queues as {
      [key: string]: QueueConfig;
    };
    queues[queue] = {
      ...queueConfig,
      options: {
        arguments: {
          'x-dead-letter-exchange': RascalExchanges.DeadLetter,
          'x-dead-letter-routing-key': deadLetterRoutingKey,
        },
      },
    };
    const bindings = config.vhosts![vhost].bindings as {
      [key: string]: BindingConfig;
    };
    bindings[`${consumerName}Binding`] = {
      source: RascalExchanges.MessageRelayer,
      destination: queue,
      destinationType: 'queue',
      bindingKeys: Object.keys(consumer().inputs).reduce(
        (acc: string[], val) => {
          // if consumer handler does not have an associated event
          // from the Outbox exclude it automatically
          if (!Object.keys(outboxEvents).includes(val)) {
            return acc;
          }

          if (!overrides) acc.push(val);
          else if (overrides[val] !== null) {
            acc.push(overrides[val] || val);
          }
          return acc;
        },
        [],
      ),
    };
    config.vhosts![vhost].subscriptions![consumerName] = {
      queue,
      contentType: 'application/json',
      retry: {
        delay: 1000,
      },
      prefetch: 10,
    };
  }

  return config;
}
