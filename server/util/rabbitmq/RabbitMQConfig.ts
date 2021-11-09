import { RABBITMQ_URI, RABBITMQ_VHOST, HANDLE_IDENTITY } from '../../config';

// We would use BrokerConfig but the "connection" type seems different
let config: any;

if (HANDLE_IDENTITY === 'publish')
  config = {
    vhosts: {
      [RABBITMQ_VHOST]: {
        connection: RABBITMQ_URI,
        exchanges: {
          EventsExchange: {
            assert: true,
            type: 'topic'
          },
          DeadLetterExchange: {
            assert: true,
          }
        },
        queues: {
          ChainEventsHandlersQueue: {
            assert: true
          },
          SubstrateIdentityEventsQueue: {
            assert: true
          },
          ChainEventsNotificationsQueue: {
            assert: true
          }
        },
        bindings: {
          ChainEventsHandlersBinding: {
            source: 'eventsExchange',
            destination: 'ChainEventsHandlersQueue',
            destinationType: 'queue',
            bindingKey: 'eQueue'
          },
          SubstrateIdentityEventsBinding: {
            source: 'eventsExchange',
            destination: 'SubstrateIdentityEventsQueue',
            destinationType: 'queue',
            bindingKey: 'iQueue'
          },
          ChainEventsNotificationsBinding: {
            source: 'eventsExchange',
            destination: 'ChainEventsNotificationsQueue',
            destinationType: 'queue',
            bindingKey: 'nQueue'
          },
          DeadLetterBinding: {
            source: 'DeadLetterExchange',
            destination: 'DeadLetterQueue',
            destinationType: 'queue',
            bindingKey:
          }
        },
        publications: {
          ChainEventsHandlersPublication: {
            exchange: 'eventsExchange',
            routingKey: 'eQueue',
            confirm: true,
            retry: {
              delay: 1000
            },
            prefetch: 10,
            timeout: 10000
          },
          SubstrateIdentityEventsPublication: {
            exchange: 'eventsExchange',
            routingKey: 'iQueue',
            confirm: true,
            retry: {
              delay: 1000
            },
            prefetch: 10,
            timeout: 10000
          },
          ChainEventsNotificationsPublication: {
            exchange: 'eventsExchange',
            routingKey: 'nQueue',
            confirm: true,
            retry: {
              delay: 1000
            },
            prefetch: 10,
            timeout: 10000
          }
        },
        subscriptions: {
          ChainEventsHandlersSubscription: {
            queue: 'ChainEventsHandlersQueue',
            contentType: 'application/json'
          },
          SubstrateIdentityEventsSubscription: {
            queue: 'SubstrateIdentityEventsQueue',
            contentType: 'application/json'
          },
          ChainEventsNotificationsPublication: {
            queue: 'ChainEventsNotificationsQueue',
            contentType: 'application/json'
          }
        }
      }
    }
  };
else if (!HANDLE_IDENTITY || HANDLE_IDENTITY === 'handle') {
  config = {
    'vhosts': {
      [RABBITMQ_VHOST]: {
        'connection': RABBITMQ_URI,
        'exchanges': {
          'eventsExchange': {
            'assert': true
          }
        },
        'queues': {
          'eventsQueue': {
            'assert': true
          }
        },
        'bindings': {
          'eventsBinding': {
            'source': 'eventsExchange',
            'destination': 'eventsQueue',
            'destinationType': 'queue',
            'bindingKey': 'eQueue'
          }
        },
        'publications': {
          'eventsPub': {
            'vhost': '/',
            'queue': 'eventsQueue',
            'confirm': true,
            'timeout': 10000
          }
        },
        'subscriptions': {
          'eventsSub': {
            'vhost': '/',
            'queue':'eventsQueue',
            'contentType': 'application/json'
          }
        }
      }
    }
  };
}

export default config;
