"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRabbitMQConfig = void 0;
const types_1 = require("./types");
/**
 * This function builds and returns the configuration json required by Rascal to properly setup and use RabbitMQ.
 * @param rabbitmq_uri The uri of the RabbitMQ instance to connect to.
 */
function getRabbitMQConfig(rabbitmq_uri) {
    let vhost, purge;
    if (rabbitmq_uri.includes('localhost') || rabbitmq_uri.includes('127.0.0.1')) {
        vhost = '/';
        purge = true;
    }
    else {
        const count = (rabbitmq_uri.match(/\//g) || []).length;
        if (count == 3) {
            // this matches for a production URL
            const res = rabbitmq_uri.split('/');
            vhost = res[res.length - 1];
            purge = false;
        }
        else if (count == 2) {
            // this matches for a Vultr URL
            vhost = '/';
            purge = true;
        }
        else {
            throw new Error("Can't create Rascal RabbitMQ Config with an invalid URI!");
        }
    }
    const queueConfig = {
        'assert': true,
        'purge': purge,
    };
    const queueOptions = {
        'x-dead-letter-exchange': types_1.RascalExchanges.DeadLetter,
        'x-dead-letter-routing-key': types_1.RascalRoutingKeys.DeadLetter
    };
    const subscriptionConfig = {
        'contentType': 'application/json',
        'retry': {
            'delay': 1000
        },
        'prefetch': 10,
    };
    const publicationConfig = {
        'confirm': true,
        'timeout': 10000,
        'options': {
            'persistent': true
        }
    };
    const exchangeConfig = {
        'assert': true,
        'options': {
            'durable': true
        }
    };
    const config = {
        'vhosts': {
            [vhost]: {
                'connection': rabbitmq_uri,
                'exchanges': {
                    [types_1.RascalExchanges.ChainEvents]: {
                        'type': 'fanout',
                        ...exchangeConfig
                    },
                    [types_1.RascalExchanges.DeadLetter]: {
                        ...exchangeConfig
                    },
                    [types_1.RascalExchanges.CUD]: {
                        'type': 'topic',
                        ...exchangeConfig
                    },
                    [types_1.RascalExchanges.Notifications]: {
                        'type': 'topic',
                        ...exchangeConfig
                    }
                },
                'queues': {
                    [types_1.RascalQueues.ChainEvents]: {
                        ...queueConfig,
                        'options': queueOptions
                    },
                    [types_1.RascalQueues.ChainEntityCUDMain]: {
                        ...queueConfig,
                        'options': queueOptions
                    },
                    [types_1.RascalQueues.ChainEventNotificationsCUDMain]: {
                        ...queueConfig,
                        'options': queueOptions
                    },
                    [types_1.RascalQueues.ChainEventNotifications]: {
                        ...queueConfig,
                        'options': {
                            ...queueOptions,
                            "x-message-ttl": 600000
                        }
                    },
                    [types_1.RascalQueues.ChainEventTypeCUDMain]: {
                        ...queueConfig,
                        'options': queueOptions
                    },
                    [types_1.RascalQueues.DeadLetter]: {
                        ...queueConfig
                    }
                },
                'bindings': {
                    [types_1.RascalBindings.ChainEvents]: {
                        'source': types_1.RascalExchanges.ChainEvents,
                        'destination': types_1.RascalQueues.ChainEvents,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.ChainEvents
                    },
                    [types_1.RascalBindings.ChainEntityCUDMain]: {
                        'source': types_1.RascalExchanges.CUD,
                        'destination': types_1.RascalQueues.ChainEntityCUDMain,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.ChainEntityCUD
                    },
                    [types_1.RascalBindings.ChainEventNotificationsCUD]: {
                        'source': types_1.RascalExchanges.CUD,
                        'destination': types_1.RascalQueues.ChainEventNotificationsCUDMain,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.ChainEventNotificationsCUD
                    },
                    [types_1.RascalBindings.ChainEventNotifications]: {
                        'source': types_1.RascalExchanges.Notifications,
                        'destination': types_1.RascalQueues.ChainEventNotifications,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalBindings.ChainEventNotifications
                    },
                    [types_1.RascalBindings.ChainEventType]: {
                        'source': types_1.RascalExchanges.CUD,
                        'destination': types_1.RascalQueues.ChainEventTypeCUDMain,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.ChainEventTypeCUD
                    },
                    [types_1.RascalBindings.DeadLetter]: {
                        'source': types_1.RascalExchanges.DeadLetter,
                        'destination': types_1.RascalQueues.DeadLetter,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.DeadLetter
                    }
                },
                'publications': {
                    [types_1.RascalPublications.ChainEvents]: {
                        'exchange': types_1.RascalExchanges.ChainEvents,
                        'routingKey': types_1.RascalRoutingKeys.ChainEvents,
                        ...publicationConfig
                    },
                    [types_1.RascalPublications.ChainEntityCUDMain]: {
                        'exchange': types_1.RascalExchanges.CUD,
                        'routingKey': types_1.RascalRoutingKeys.ChainEntityCUD,
                        ...publicationConfig
                    },
                    [types_1.RascalPublications.ChainEventNotificationsCUDMain]: {
                        'exchange': types_1.RascalExchanges.CUD,
                        'routingKey': types_1.RascalRoutingKeys.ChainEventNotificationsCUD,
                        ...publicationConfig
                    },
                    [types_1.RascalPublications.ChainEventNotifications]: {
                        'exchange': types_1.RascalExchanges.Notifications,
                        'routingKey': types_1.RascalRoutingKeys.ChainEventNotifications,
                        ...publicationConfig
                    },
                    [types_1.RascalPublications.ChainEventTypeCUDMain]: {
                        'exchange': types_1.RascalExchanges.CUD,
                        'routingKey': types_1.RascalRoutingKeys.ChainEventTypeCUD,
                        ...publicationConfig
                    }
                },
                'subscriptions': {
                    [types_1.RascalSubscriptions.ChainEvents]: {
                        'queue': types_1.RascalQueues.ChainEvents,
                        ...subscriptionConfig
                    },
                    [types_1.RascalSubscriptions.ChainEntityCUDMain]: {
                        'queue': types_1.RascalQueues.ChainEntityCUDMain,
                        ...subscriptionConfig
                    },
                    [types_1.RascalSubscriptions.ChainEventNotificationsCUDMain]: {
                        'queue': types_1.RascalQueues.ChainEventNotificationsCUDMain,
                        ...subscriptionConfig
                    },
                    [types_1.RascalSubscriptions.ChainEventNotifications]: {
                        'queue': types_1.RascalQueues.ChainEventNotifications,
                        ...subscriptionConfig
                    },
                    [types_1.RascalSubscriptions.ChainEventTypeCUDMain]: {
                        'queue': types_1.RascalQueues.ChainEventTypeCUDMain,
                        ...subscriptionConfig
                    }
                }
            },
        }
    };
    // the above configuration is correct but Rascal has some type issues
    return config;
}
exports.getRabbitMQConfig = getRabbitMQConfig;
