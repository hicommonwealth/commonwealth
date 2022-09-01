import Rascal from "rascal";
import { RascalPublications, RascalSubscriptions } from "./types";

/**
 * This function builds and returns the configuration json required by Rascal to properly setup and use RabbitMQ.
 * @param rabbitmq_uri The uri of the RabbitMQ instance to connect to.
 */
export function getRabbitMQConfig(rabbitmq_uri: string): Rascal.BrokerConfig {
  let vhost, purge;

  if (rabbitmq_uri.includes('localhost') || rabbitmq_uri.includes('127.0.0.1')) {
    vhost = '/';
    purge = true;
  } else {
    const count = (rabbitmq_uri.match(/\//g) || []).length;
    if (count == 3) {
      // this matches for a production URL
      const res = rabbitmq_uri.split('/');
      vhost = res[res.length - 1];
      purge = false;
    } else if (count == 2) {
      // this matches for a Vultr URL
      vhost = '/'
      purge = true;
    } else {
      throw new Error("Can't create Rascal RabbitMQ Config with an invalid URI!")
    }
  }

  const config = {
    'vhosts': {
      [vhost]: {
        'connection': rabbitmq_uri,
        'exchanges': {
          'ChainEventsExchange': {
            'assert': true,
            'type': 'fanout',
            'options': {
              'durable': true,
            }
          },
          'CreateUpdateDeleteExchange': {
            'assert': true,
            'type': 'topic',
            'options': {
              'durable': true
            }
          },
          'NotificationsExchange': {
            'assert': true,
            'type': 'topic',
            'options': {
              'durable': true
            }
          }
        },
        'queues': {
          'ChainEventsQueue': {
            'assert': true,
            'purge': purge,
          },
          'ChainCUDChainEventsQueue': {
            'assert': true,
            'purge': purge,
          },
          'ChainEntityCUDMainQueue': {
            'assert': true,
            'purge': purge,
          },
          'ChainEventNotificationsCUDMainQueue': {
            'assert': true,
            'purge': purge,
          },
          'ChainEventNotificationsQueue': {
            'assert': true,
            'purge': purge,
          }
        },
        'bindings': {
          'ChainEventsBinding': {
            'source': 'ChainEventsExchange',
            'destination': 'ChainEventsQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainEvents'
          },
          'ChainCUDChainEventsBinding': {
            'source': 'CreateUpdateDeleteExchange',
            'destination': 'ChainCUDChainEventsQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainCUD'
          },
          'ChainEntityCUDMainBinding': {
            'source': 'CreateUpdateDeleteExchange',
            'destination': 'ChainEntityCUDMainQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainEntityCUD'
          },
          'ChainEventNotificationsCUDBinding': {
            'source': 'CreateUpdateDeleteExchange',
            'destination': 'ChainEventNotificationsCUDMainQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainEventNotificationsCUD'
          },
          'ChainEventNotificationsBinding': {
            'source': 'NotificationsExchange',
            'destination': 'ChainEventNotificationsQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainEventNotifications'
          },
        },
        'publications': {
          [RascalPublications.ChainEvents]: {
            'exchange': 'ChainEventsExchange',
            'routingKey': 'ChainEvents',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          },
          [RascalPublications.ChainCUDChainEvents]: {
            'exchange': 'CreateUpdateDeleteExchange',
            'routingKey': 'ChainCUD',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          },
          [RascalPublications.ChainEntityCUDMain]: {
            'exchange': 'CreateUpdateDeleteExchange',
            'routingKey': 'ChainEntityCUD',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          },
          [RascalPublications.ChainEventNotificationsCUDMain]: {
            'exchange': 'CreateUpdateDeleteExchange',
            'routingKey': 'ChainEventNotificationsCUD',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          },
          [RascalPublications.ChainEventNotifications]: {
            'exchange': 'NotificationsExchange',
            'routingKey': 'ChainEventNotifications',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          },
        },
        'subscriptions': {
          [RascalSubscriptions.ChainEvents]: {
            'queue': 'ChainEventsQueue',
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainCUDChainEvents]: {
            'queue': 'ChainCUDChainEventsQueue',
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainEntityCUDMain]: {
            'queue': 'ChainEntityCUDMainQueue',
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainEventNotificationsCUDMain]: {
            'queue': 'ChainEventNotificationsCUDMainQueue',
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainEventNotifications]: {
            'queue': 'ChainEventNotificationsQueue',
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

  // the above configuration is correct but Rascal has some type issues
  return <Rascal.BrokerConfig>config;
}
