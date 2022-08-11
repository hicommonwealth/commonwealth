import Rascal from "rascal";

/**
 * This function builds and returns the configuration json required by Rascal to properly setup and use RabbitMQ.
 * @param rabbitmq_uri The uri of the RabbitMQ instance to connect to.
 */
function getRabbitMQConfig(rabbitmq_uri: string): Rascal.BrokerConfig {
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
          'CreateDeleteExchange': {
            'assert': true,
            'type': 'topic',
            'options': {
              'durable': true
            }
          },
        },
        'queues': {
          'ChainEventsQueue': {
            'assert': true,
            'purge': purge,
          },
          'ChainCDChainEventsQueue': {
            'assert': true,
            'purge': purge,
          },
          'ChainEntityCDMainQueue': {
            'assert': true,
            'purge': purge,
          },
          'ChainEventNotificationsQueue': {
            'assert': true,
            'purge': purge,
          },
        },
        'bindings': {
          'ChainEventsBinding': {
            'source': 'ChainEventsExchange',
            'destination': 'ChainEventsQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainEvents'
          },
          'ChainCDChainEventsBinding': {
            'source': 'CreateDeleteExchange',
            'destination': 'ChainCDChainEventsQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainCD'
          },
          'ChainEntityCDMainBinding': {
            'source': 'CreateDeleteExchange',
            'destination': 'ChainEntityCDMainQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainEntityCD'
          },
          'ChainEventNotificationsBinding': {
            'source': 'ChainEventsExchange',
            'destination': 'ChainEventNotificationsQueue',
            'destinationType': 'queue',
            'bindingKey': 'ChainEventNotifications'
          }
        },
        'publications': {
          'ChainEventsPublication': {
            'exchange': 'ChainEventsExchange',
            'routingKey': 'ChainEvents',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          },
          'ChainCDChainEventsPublication': {
            'exchange': 'CreateDeleteExchange',
            'routingKey': 'ChainCD',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          },
          'ChainEntityCDMainPublication': {
            'exchange': 'CreateDeleteExchange',
            'routingKey': 'ChainEntityCD',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            },
          },
          'ChainEventNotificationsPublication': {
            'exchange': 'ChainEventsExchange',
            'routingKey': 'ChainEvents',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          }
        },
        'subscriptions': {
          'ChainEventsSubscription': {
            'queue': 'ChainEventsQueue',
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          'ChainCDChainEventsSubscription': {
            'queue': 'ChainCDChainEventsQueue',
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          'ChainEntityCDMainSubscription': {
            'queue': 'ChainEntityCDMainQueue',
            'contentType': 'application/json',
            'retry': {
              'delay': 1000
            },
            'prefetch': 10,
          },
          'ChainEventNotificationsSubscription': {
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

export default getRabbitMQConfig
