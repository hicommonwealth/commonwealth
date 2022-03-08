import { RABBITMQ_URI } from '../../config';

const vhost = RABBITMQ_URI.includes('localhost')
  ? '/'
  : RABBITMQ_URI.split('/')[RABBITMQ_URI.split('/').length - 1];
const purge = RABBITMQ_URI.includes('localhost');

const config = {
  vhosts: {
    [vhost]: {
      connection: RABBITMQ_URI,
      exchanges: {
        EventsExchange: {
          assert: true,
          type: 'topic',
        },
        DeadLetterExchange: {
          assert: true,
        },
      },
      queues: {
        ChainEventsHandlersQueue: {
          assert: true,
          purge: purge,
          options: {
            'x-dead-letter-exchange': 'DeadLetterExchange',
            'dead-letter-routing-key': 'dlQueue',
          },
        },
        SubstrateIdentityEventsQueue: {
          assert: true,
          purge: purge,
          options: {
            'x-dead-letter-exchange': 'DeadLetterExchange',
            'dead-letter-routing-key': 'dlQueue',
          },
        },
        ChainEventsNotificationsQueue: {
          assert: true,
          purge: purge,
          options: {
            'x-dead-letter-exchange': 'DeadLetterExchange',
            'dead-letter-routing-key': 'dlQueue',
          },
        },
        DeadLetterQueue: {
          assert: true,
          purge: purge,
        },
      },
      bindings: {
        ChainEventsHandlersBinding: {
          source: 'EventsExchange',
          destination: 'ChainEventsHandlersQueue',
          destinationType: 'queue',
          bindingKey: 'eQueue',
        },
        SubstrateIdentityEventsBinding: {
          source: 'EventsExchange',
          destination: 'SubstrateIdentityEventsQueue',
          destinationType: 'queue',
          bindingKey: 'iQueue',
        },
        ChainEventsNotificationsBinding: {
          source: 'EventsExchange',
          destination: 'ChainEventsNotificationsQueue',
          destinationType: 'queue',
          bindingKey: 'nQueue',
        },
        DeadLetterBinding: {
          source: 'DeadLetterExchange',
          destination: 'DeadLetterQueue',
          destinationType: 'queue',
          bindingKey: 'dlQueue',
        },
      },
      publications: {
        ChainEventsHandlersPublication: {
          exchange: 'EventsExchange',
          routingKey: 'eQueue',
          confirm: true,
          timeout: 10000,
          options: {
            persistent: true,
          },
        },
        SubstrateIdentityEventsPublication: {
          exchange: 'EventsExchange',
          routingKey: 'iQueue',
          confirm: true,
          timeout: 10000,
          options: {
            persistent: true,
          },
        },
        ChainEventsNotificationsPublication: {
          exchange: 'EventsExchange',
          routingKey: 'nQueue',
          confirm: true,
          timeout: 10000,
          options: {
            persistent: true,
          },
        },
      },
      subscriptions: {
        ChainEventsHandlersSubscription: {
          queue: 'ChainEventsHandlersQueue',
          contentType: 'application/json',
          retry: {
            delay: 1000,
          },
          prefetch: 10,
        },
        SubstrateIdentityEventsSubscription: {
          queue: 'SubstrateIdentityEventsQueue',
          contentType: 'application/json',
          retry: {
            delay: 1000,
          },
          prefetch: 10,
        },
        ChainEventsNotificationsSubscription: {
          queue: 'ChainEventsNotificationsQueue',
          contentType: 'application/json',
          retry: {
            delay: 1000,
          },
          prefetch: 10,
        },
      },
    },
  },
};

export default config;
