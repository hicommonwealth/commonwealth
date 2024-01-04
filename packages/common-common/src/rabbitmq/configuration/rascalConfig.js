'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getAllRascalConfigs = void 0;
const types_1 = require('../types');
function getAllRascalConfigs(rabbitmq_uri, vhost, purge) {
  const queueConfig = {
    assert: true,
    purge: purge,
  };
  const queueOptions = {
    'x-dead-letter-exchange': types_1.RascalExchanges.DeadLetter,
    'x-dead-letter-routing-key': types_1.RascalRoutingKeys.DeadLetter,
  };
  const subscriptionConfig = {
    contentType: 'application/json',
    retry: {
      delay: 1000,
    },
    prefetch: 10,
  };
  const publicationConfig = {
    confirm: true,
    timeout: 10000,
    options: {
      persistent: true,
    },
  };
  const exchangeConfig = {
    assert: true,
    options: {
      durable: true,
    },
  };
  const allExchanges = {
    [types_1.RascalExchanges.SnapshotListener]: {
      type: 'fanout',
      ...exchangeConfig,
    },
    [types_1.RascalExchanges.Discobot]: {
      type: 'fanout',
      ...exchangeConfig,
    },
  };
  const allQueues = {
    [types_1.RascalQueues.SnapshotListener]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
    [types_1.RascalQueues.DiscordListener]: {
      ...queueConfig,
      options: {
        arguments: queueOptions,
      },
    },
  };
  const allBindings = {
    [types_1.RascalBindings.SnapshotListener]: {
      source: types_1.RascalExchanges.SnapshotListener,
      destination: types_1.RascalQueues.SnapshotListener,
      destinationType: 'queue',
      bindingKey: types_1.RascalRoutingKeys.SnapshotListener,
    },
    [types_1.RascalBindings.DiscordListener]: {
      source: types_1.RascalExchanges.Discobot,
      destination: types_1.RascalQueues.DiscordListener,
      destinationType: 'queue',
      bindingKey: types_1.RascalRoutingKeys.DiscordListener,
    },
  };
  const allPublications = {
    [types_1.RascalPublications.SnapshotListener]: {
      exchange: types_1.RascalExchanges.SnapshotListener,
      routingKey: types_1.RascalRoutingKeys.SnapshotListener,
      ...publicationConfig,
    },
    [types_1.RascalPublications.DiscordListener]: {
      exchange: types_1.RascalExchanges.Discobot,
      routingKey: types_1.RascalRoutingKeys.DiscordListener,
      ...publicationConfig,
    },
  };
  const allSubscriptions = {
    [types_1.RascalSubscriptions.SnapshotListener]: {
      queue: types_1.RascalQueues.SnapshotListener,
      ...subscriptionConfig,
    },
    [types_1.RascalSubscriptions.DiscordListener]: {
      queue: types_1.RascalQueues.DiscordListener,
      ...subscriptionConfig,
    },
  };
  const baseConfig = {
    vhosts: {
      [vhost]: {
        connection: rabbitmq_uri,
        exchanges: {
          [types_1.RascalExchanges.DeadLetter]: {
            ...exchangeConfig,
          },
        },
        queues: {
          [types_1.RascalQueues.DeadLetter]: {
            ...queueConfig,
          },
        },
        bindings: {
          [types_1.RascalBindings.DeadLetter]: {
            source: types_1.RascalExchanges.DeadLetter,
            destination: types_1.RascalQueues.DeadLetter,
            destinationType: 'queue',
            bindingKey: types_1.RascalRoutingKeys.DeadLetter,
          },
        },
        publications: {},
        subscriptions: {},
      },
    },
  };
  return {
    baseConfig,
    allExchanges,
    allBindings,
    allQueues,
    allPublications,
    allSubscriptions,
  };
}
exports.getAllRascalConfigs = getAllRascalConfigs;
