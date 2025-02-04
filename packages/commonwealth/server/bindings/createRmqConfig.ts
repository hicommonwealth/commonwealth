import { config as EnvConfig, RascalExchanges } from '@hicommonwealth/adapters';
import { RoutingKeyTags } from '@hicommonwealth/core';
import {
  ChainEventPolicy,
  Contest,
  ContestWorker,
  DiscordBotPolicy,
  FarcasterWorker,
  NotificationsPolicy,
  User,
} from '@hicommonwealth/model';
import { EventNames } from '@hicommonwealth/schemas';
import { BrokerConfig, ConnectionConfig } from 'rascal';
import { NotificationsSettingsPolicy } from '../workers/knock/NotificationsSettings.policy';

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
  // TODO: add types so that override keys are a partial record of consumer input generic
  map: { consumer: any; overrides?: Record<string, string | null> }[];
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
  // @ts-ignore
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
            // TODO: Bump rascal + @types/rascal to latest
            // @ts-ignore --> Rascal type issue
            timeout: 10000,
            options: {
              persistent: true,
            },
          },
        },
        subscriptions: {},
      },
    },
  };

  for (const { consumer, overrides } of map) {
    const consumerName = consumer.name;
    const queue = `${consumerName}Queue`;
    config.vhosts![vhost].queues![queue] = {
      ...queueConfig,
      options: {
        arguments: {
          'x-dead-letter-exchange': RascalExchanges.DeadLetter,
          'x-dead-letter-routing-key': deadLetterRoutingKey,
        },
      },
    };
    config.vhosts![vhost].bindings![`${consumerName}Binding`] = {
      source: RascalExchanges.MessageRelayer,
      destination: queue,
      destinationType: 'queue',
      bindingKeys: Object.keys(consumer().inputs).reduce(
        (acc: string[], val) => {
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

createRmqConfig({
  rabbitMqUri: 'localhost:5672',
  map: [
    {
      consumer: ChainEventPolicy,
    },
    {
      consumer: DiscordBotPolicy,
    },
    {
      consumer: NotificationsPolicy,
      overrides: {
        ThreadCreated: null,
        ThreadUpvoted: `${EventNames.ThreadUpvoted}.#`,
      },
    },
    {
      consumer: NotificationsSettingsPolicy,
    },
    {
      consumer: ContestWorker,
      overrides: {
        ThreadCreated: `${EventNames.ThreadCreated}.${RoutingKeyTags.Contest}.#`,
        ThreadUpvoted: `${EventNames.ThreadUpvoted}.${RoutingKeyTags.Contest}.#`,
        ContestRolloverTimerTicked: null,
      },
    },
    {
      consumer: Contest.Contests,
    },
    {
      consumer: User.Xp,
      overrides: {
        ThreadCreated: `${EventNames.ThreadCreated}.#`,
        ThreadUpvoted: `${EventNames.ThreadUpvoted}.#`,
      },
    },
    {
      consumer: User.UserReferrals,
    },
    {
      consumer: FarcasterWorker,
    },
  ],
});
