import { RABBITMQ_URI } from '../../config';

const vhost = RABBITMQ_URI.includes('localhost') ? '/' : RABBITMQ_URI.split('/')[RABBITMQ_URI.split('/').length - 1]

const config = {
  'vhosts': {
    [vhost]: {
      'connection': RABBITMQ_URI,
      'exchanges': {
        'EventsExchange': {
          'assert': true,
          'type': 'topic'
        },
        'DeadLetterExchange': {
          'assert': true,
        }
      },
      'queues': {
        'ChainEventsHandlersQueue': {
          'assert': true
        },
        'SubstrateIdentityEventsQueue': {
          'assert': true
        },
        'ChainEventsNotificationsQueue': {
          'assert': true
        },
        'DeadLetterQueue': {
          'assert': true
        }
      },
      'bindings': {
        'ChainEventsHandlersBinding': {
          'source': 'eventsExchange',
          'destination': 'ChainEventsHandlersQueue',
          'destinationType': 'queue',
          'bindingKey': 'eQueue'
        },
        'SubstrateIdentityEventsBinding': {
          'source': 'eventsExchange',
          'destination': 'SubstrateIdentityEventsQueue',
          'destinationType': 'queue',
          'bindingKey': 'iQueue'
        },
        'ChainEventsNotificationsBinding': {
          'source': 'eventsExchange',
          'destination': 'ChainEventsNotificationsQueue',
          'destinationType': 'queue',
          'bindingKey': 'nQueue'
        },
        'DeadLetterBinding': {
          'source': 'DeadLetterExchange',
          'destination': 'DeadLetterQueue',
          'destinationType': 'queue',
          'bindingKey': 'dlQueue'
        }
      },
      'publications': {
        'ChainEventsHandlersPublication': {
          'exchange': 'eventsExchange',
          'routingKey': 'eQueue',
          'confirm': true,
          'timeout': 10000,
          'options': {
            'persistent': true
          }
        },
        'SubstrateIdentityEventsPublication': {
          'exchange': 'eventsExchange',
          'routingKey': 'iQueue',
          'confirm': true,
          'timeout': 10000,
          'options': {
            'persistent': true
          }
        },
        'ChainEventsNotificationsPublication': {
          'exchange': 'eventsExchange',
          'routingKey': 'nQueue',
          'confirm': true,
          'timeout': 10000,
          'options': {
            'persistent': true
          }
        }
      },
      'subscriptions': {
        'ChainEventsHandlersSubscription': {
          'queue': 'ChainEventsHandlersQueue',
          'contentType': 'application/json',
          'retry': {
            'delay': 1000
          },
          'prefetch': 10,
        },
        'SubstrateIdentityEventsSubscription': {
          'queue': 'SubstrateIdentityEventsQueue',
          'contentType': 'application/json',
          'retry': {
            'delay': 1000
          },
          'prefetch': 10,
        },
        'ChainEventsNotificationsPublication': {
          'queue': 'ChainEventsNotificationsQueue',
          'contentType': 'application/json',
          'retry': {
            'delay': 1000
          },
          'prefetch': 10,
        }
      }
    }
  }
};

export default config;
