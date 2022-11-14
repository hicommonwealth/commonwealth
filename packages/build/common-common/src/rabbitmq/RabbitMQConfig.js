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
    const config = {
        'vhosts': {
            [vhost]: {
                'connection': rabbitmq_uri,
                'exchanges': {
                    [types_1.RascalExchanges.ChainEvents]: {
                        'assert': true,
                        'type': 'topic',
                        'options': {
                            'durable': true,
                        },
                    },
                    [types_1.RascalExchanges.Notifications]: {
                        'assert': true,
                        'type': 'fanout',
                        'options': {
                            'durable': true,
                        },
                    },
                    [types_1.RascalExchanges.SnapshotListener]: {
                        assert: true,
                        type: 'fanout',
                        options: {
                            durable: true,
                        },
                    },
                    [types_1.RascalExchanges.DeadLetter]: {
                        'assert': true,
                        'options': {
                            'durable': true
                        }
                    }
                },
                'queues': {
                    [types_1.RascalQueues.ChainEvents]: {
                        ...queueConfig,
                        'options': {
                            'arguments': {
                                ...queueOptions
                            }
                        }
                    },
                    [types_1.RascalQueues.SubstrateIdentityEvents]: {
                        ...queueConfig,
                        'options': {
                            'arguments': {
                                ...queueOptions
                            }
                        }
                    },
                    [types_1.RascalQueues.ChainEventNotifications]: {
                        ...queueConfig,
                        'options': {
                            "arguments": {
                                ...queueOptions,
                                "x-message-ttl": 600000
                            }
                        }
                    },
                    [types_1.RascalQueues.SnapshotListener]: {
                        ...queueConfig,
                        'options': {
                            "arguments": {
                                ...queueOptions,
                            }
                        }
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
                    [types_1.RascalBindings.SubstrateIdentityEvents]: {
                        'source': types_1.RascalExchanges.ChainEvents,
                        'destination': types_1.RascalQueues.SubstrateIdentityEvents,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.SubstrateIdentityEvents
                    },
                    [types_1.RascalBindings.ChainEventNotifications]: {
                        'source': types_1.RascalExchanges.Notifications,
                        'destination': types_1.RascalQueues.ChainEventNotifications,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.ChainEventNotifications
                    },
                    [types_1.RascalBindings.SnapshotListener]: {
                        'source': types_1.RascalExchanges.SnapshotListener,
                        'destination': types_1.RascalQueues.SnapshotListener,
                        'destinationType': 'queue',
                        'bindingKey': types_1.RascalRoutingKeys.SnapshotListener
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
                    [types_1.RascalPublications.SubstrateIdentityEvents]: {
                        'exchange': types_1.RascalExchanges.ChainEvents,
                        'routingKey': types_1.RascalRoutingKeys.SubstrateIdentityEvents,
                        ...publicationConfig
                    },
                    [types_1.RascalPublications.ChainEventNotifications]: {
                        'exchange': types_1.RascalExchanges.Notifications,
                        'routingKey': types_1.RascalRoutingKeys.ChainEventNotifications,
                        ...publicationConfig
                    },
                    [types_1.RascalPublications.SnapshotListener]: {
                        'exchange': types_1.RascalExchanges.SnapshotListener,
                        'routingKey': types_1.RascalRoutingKeys.SnapshotListener,
                        ...publicationConfig
                    }
                },
                'subscriptions': {
                    [types_1.RascalSubscriptions.ChainEvents]: {
                        'queue': types_1.RascalQueues.ChainEvents,
                        ...subscriptionConfig
                    },
                    [types_1.RascalSubscriptions.SubstrateIdentityEvents]: {
                        'queue': types_1.RascalQueues.SubstrateIdentityEvents,
                        ...subscriptionConfig
                    },
                    [types_1.RascalSubscriptions.ChainEventNotifications]: {
                        'queue': types_1.RascalQueues.ChainEventNotifications,
                        ...subscriptionConfig
                    },
                    [types_1.RascalSubscriptions.SnapshotListener]: {
                        'queue': types_1.RascalQueues.SnapshotListener,
                        ...subscriptionConfig
                    }
                }
            }
        }
    };
    // the above configuration is correct but Rascal has some type issues
    return config;
}
exports.getRabbitMQConfig = getRabbitMQConfig;
