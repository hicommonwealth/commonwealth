import { config as EnvConfig } from '@hicommonwealth/adapters';
import { Consumer, EventsHandlerMetadata } from '@hicommonwealth/core';
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

export enum RascalQueues {
  DeadLetter = 'DeadLetterQueue',
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: Array<Consumer<EventsHandlerMetadata<any>>>;
}) {
  let vhost: string;
  let connection = <ConnectionConfig>rabbitMqUri;
  if (
    rabbitMqUri.includes('localhost') ||
    rabbitMqUri.includes('127.0.0.1') ||
    rabbitMqUri.includes('railway')
  ) {
    vhost = '/';
  } else {
    const count = (rabbitMqUri.match(/\//g) || []).length;
    if (count == 3) {
      // this matches for a production URL
      const res = rabbitMqUri.split('/');
      vhost = res[res.length - 1];
    } else {
      throw new Error(
        "Can't create Rascal RabbitMQ Config with an invalid URI!",
      );
    }
  }

  if (EnvConfig.BROKER.RABBITMQ_FRAME_SIZE) {
    // necessary until rascal upgrades amqp version >= 0.10.6
    connection = {
      url: rabbitMqUri,
      options: {
        frameMax: EnvConfig.BROKER.RABBITMQ_FRAME_SIZE,
      },
    };
  }

  const queueConfig = {
    assert: true,
    purge:
      ['local', 'CI'].includes(EnvConfig.APP_ENV) &&
      !EnvConfig.BROKER.DISABLE_LOCAL_QUEUE_PURGE,
  };
  const deadLetterRoutingKey = 'DeadLetter';
  const exchangeConfig = {
    assert: true,
    options: {
      durable: true,
    },
  };

  const config: BrokerConfig = {
    vhosts: {
      [vhost]: {
        connection,
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
          [RascalQueues.DeadLetter]: {
            ...queueConfig,
          },
        },
        bindings: {
          DeadLetterBinding: {
            source: RascalExchanges.DeadLetter,
            destination: RascalQueues.DeadLetter,
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
        subscriptions: {
          dlq_handler: {
            queue: RascalQueues.DeadLetter,
            contentType: 'application/json',
            prefetch: 10,
          },
        },
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

    const consumerInputs = consumer()?.inputs ?? consumer();

    bindings[`${consumerName}Binding`] = {
      source: RascalExchanges.MessageRelayer,
      destination: queue,
      destinationType: 'queue',
      bindingKeys: Object.keys(consumerInputs).reduce((acc, key) => {
        if (!overrides) acc.push(key);
        else if (overrides[key] !== null) acc.push(overrides[key] || key);
        return acc;
      }, [] as string[]),
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
