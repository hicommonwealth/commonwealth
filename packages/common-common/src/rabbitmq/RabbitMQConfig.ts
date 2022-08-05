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
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': 'DeadLetterExchange',
              'dead-letter-routing-key': 'dlQueue'
            }
          },
          'SubstrateIdentityEventsQueue': {
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': 'DeadLetterExchange',
              'dead-letter-routing-key': 'dlQueue'
            }
          },
          'ChainEventsNotificationsQueue': {
            'assert': true,
            'purge': purge,
            'options': {
              'x-dead-letter-exchange': 'DeadLetterExchange',
              'dead-letter-routing-key': 'dlQueue',
              "arguments": {
                "x-message-ttl": 600000
              }
            }
          },
          'DeadLetterQueue': {
            'assert': true,
            'purge': purge
          }
        },
        'bindings': {
          'ChainEventsHandlersBinding': {
            'source': 'EventsExchange',
            'destination': 'ChainEventsHandlersQueue',
            'destinationType': 'queue',
            'bindingKey': 'eQueue'
          },
          'SubstrateIdentityEventsBinding': {
            'source': 'EventsExchange',
            'destination': 'SubstrateIdentityEventsQueue',
            'destinationType': 'queue',
            'bindingKey': 'iQueue'
          },
          'ChainEventsNotificationsBinding': {
            'source': 'EventsExchange',
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
            'exchange': 'EventsExchange',
            'routingKey': 'eQueue',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          },
          'SubstrateIdentityEventsPublication': {
            'exchange': 'EventsExchange',
            'routingKey': 'iQueue',
            'confirm': true,
            'timeout': 10000,
            'options': {
              'persistent': true
            }
          },
          'ChainEventsNotificationsPublication': {
            'exchange': 'EventsExchange',
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
          'ChainEventsNotificationsSubscription': {
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

  // the above configuration is correct but Rascal has some type issues
  return <Rascal.BrokerConfig>config;
}

export default getRabbitMQConfig
