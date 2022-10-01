import * as Rascal from "rascal";
import {
  RascalBindings,
  RascalExchanges,
  RascalPublications,
  RascalQueues,
  RascalRoutingKeys,
  RascalSubscriptions
} from "./types";

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
          [RascalExchanges.ChainEvents]: {
            'assert': true,
            'type': 'fanout',
            'options': {
              'durable': true,
            },
          },
          [RascalExchanges.DeadLetter]: {
            'assert': true,
            'options': {
              'durable': true
            }
          },
          [RascalExchanges.CUD]: {
            'assert': true,
            'type': 'topic',
            'options': {
              'durable': true
            }
          },
          [RascalExchanges.Notifications]: {
            'assert': true,
            'type': 'topic',
            'options': {
              'durable': true
            }
          }
        },
        'queues': {
          [RascalQueues.ChainEvents]: {
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': RascalExchanges.DeadLetter,
              'dead-letter-routing-key': RascalRoutingKeys.DeadLetter
            }
          },
          [RascalQueues.ChainEntityCUDMain]: {
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': RascalExchanges.DeadLetter,
              'dead-letter-routing-key': RascalRoutingKeys.DeadLetter
            }
          },
          [RascalQueues.ChainEventNotificationsCUDMain]: {
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': RascalExchanges.DeadLetter,
              'dead-letter-routing-key': RascalRoutingKeys.DeadLetter
            }
          },
          [RascalQueues.ChainEventNotifications]: {
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': RascalExchanges.DeadLetter,
              'dead-letter-routing-key': RascalRoutingKeys.DeadLetter
            }
          },
          [RascalQueues.ChainEventTypeCUDMain]: {
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': RascalExchanges.DeadLetter,
              'dead-letter-routing-key': RascalRoutingKeys.DeadLetter
            }
          },
          [RascalQueues.DeadLetter]: {
            'assert': true,
            'purge': purge
          }
        },
        'bindings': {
          [RascalBindings.ChainEvents]: {
            'source': RascalExchanges.ChainEvents,
            'destination': RascalQueues.ChainEvents,
            'destinationType': 'queue',
            'bindingKey': RascalRoutingKeys.ChainEvents
          },
          [RascalBindings.ChainEntityCUDMain]: {
            'source': RascalExchanges.CUD,
            'destination': RascalQueues.ChainEntityCUDMain,
            'destinationType': 'queue',
            'bindingKey': RascalRoutingKeys.ChainEntityCUD
          },
          [RascalBindings.ChainEventNotificationsCUD]: {
            'source': RascalExchanges.CUD,
            'destination': RascalQueues.ChainEventNotificationsCUDMain,
            'destinationType': 'queue',
            'bindingKey': RascalRoutingKeys.ChainEventNotificationsCUD
          },
          [RascalBindings.ChainEventNotifications]: {
            'source': RascalExchanges.Notifications,
            'destination': RascalQueues.ChainEventNotifications,
            'destinationType': 'queue',
            'bindingKey': RascalBindings.ChainEventNotifications
          },
          [RascalBindings.ChainEventType]: {
            'source': RascalExchanges.CUD,
            'destination': RascalQueues.ChainEventTypeCUDMain,
            'destinationType': 'queue',
            'bindingKey': RascalRoutingKeys.ChainEventTypeCUD
          },
          [RascalBindings.DeadLetter]: {
            'source': RascalExchanges.DeadLetter,
            'destination': RascalQueues.DeadLetter,
            'destinationType': 'queue',
            'bindingKey': RascalRoutingKeys.DeadLetter
          }
        },
        'publications': {
          [RascalPublications.ChainEvents]: {
            'exchange': RascalExchanges.ChainEvents,
            'routingKey': RascalRoutingKeys.ChainEvents,
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          },
          [RascalPublications.ChainEntityCUDMain]: {
            'exchange': RascalExchanges.CUD,
            'routingKey': RascalRoutingKeys.ChainEntityCUD,
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          },
          [RascalPublications.ChainEventNotificationsCUDMain]: {
            'exchange': RascalExchanges.CUD,
            'routingKey': RascalRoutingKeys.ChainEventNotificationsCUD,
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          },
          [RascalPublications.ChainEventNotifications]: {
            'exchange': RascalExchanges.Notifications,
            'routingKey': RascalRoutingKeys.ChainEventNotifications,
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          },
          [RascalPublications.ChainEventTypeCUDMain]: {
            'exchange': RascalExchanges.CUD,
            'routingKey': RascalRoutingKeys.ChainEventTypeCUD,
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          }
        },
        'subscriptions': {
          [RascalSubscriptions.ChainEvents]: {
            'queue': RascalQueues.ChainEvents,
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainCUDChainEvents]: {
            'queue': RascalQueues.ChainCUDChainEvents,
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainEntityCUDMain]: {
            'queue': RascalQueues.ChainEntityCUDMain,
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainEventNotificationsCUDMain]: {
            'queue': RascalQueues.ChainEventNotificationsCUDMain,
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainEventNotifications]: {
            'queue': RascalQueues.ChainEventNotifications,
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          [RascalSubscriptions.ChainEventTypeCUDMain]: {
            'queue': RascalQueues.ChainEventTypeCUDMain,
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          }
        }
      },
    }
  }

// the above configuration is correct but Rascal has some type issues
  return <Rascal.BrokerConfig>config;
}
