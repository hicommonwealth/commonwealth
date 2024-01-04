'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getRabbitMQConfig = exports.RascalConfigServices = void 0;
const rascalConfig_1 = require('./configuration/rascalConfig');
const types_1 = require('./types');
var RascalConfigServices;
(function (RascalConfigServices) {
  RascalConfigServices['CommonwealthService'] = 'commonwealth';
  RascalConfigServices['SnapshotService'] = 'snapshot';
  RascalConfigServices['DiscobotService'] = 'discobot';
})(
  RascalConfigServices ||
    (exports.RascalConfigServices = RascalConfigServices = {}),
);
/**
 * This function builds and returns the configuration json required by Rascal to properly setup and use RabbitMQ.
 * @param rabbitmq_uri The uri of the RabbitMQ instance to connect to.
 * @param service The service determining which config to return.
 */
function getRabbitMQConfig(rabbitmq_uri, service) {
  let vhost, purge;
  if (
    rabbitmq_uri.includes('localhost') ||
    rabbitmq_uri.includes('127.0.0.1')
  ) {
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
      vhost = '/';
      purge = true;
    } else {
      throw new Error(
        "Can't create Rascal RabbitMQ Config with an invalid URI!",
      );
    }
  }
  const copyConfigs = (source, target, keys) =>
    keys.forEach((key) => (target[key] = source[key]));
  const {
    baseConfig,
    allExchanges,
    allPublications,
    allSubscriptions,
    allQueues,
    allBindings,
  } = (0, rascalConfig_1.getAllRascalConfigs)(rabbitmq_uri, vhost, purge);
  const config = baseConfig;
  const vhostConfig = config.vhosts[vhost];
  if (service === RascalConfigServices.CommonwealthService) {
    copyConfigs(allExchanges, vhostConfig.exchanges, [
      types_1.RascalExchanges.SnapshotListener,
      types_1.RascalExchanges.Discobot,
    ]);
    copyConfigs(allQueues, vhostConfig.queues, [
      types_1.RascalQueues.SnapshotListener,
      types_1.RascalQueues.DiscordListener,
    ]);
    copyConfigs(allBindings, vhostConfig.bindings, [
      types_1.RascalBindings.SnapshotListener,
      types_1.RascalBindings.DiscordListener,
    ]);
    copyConfigs(allPublications, vhostConfig.publications, [
      types_1.RascalPublications.SnapshotListener,
      types_1.RascalPublications.DiscordListener,
    ]);
    copyConfigs(allSubscriptions, vhostConfig.subscriptions, [
      types_1.RascalSubscriptions.SnapshotListener,
      types_1.RascalSubscriptions.DiscordListener,
    ]);
  } else if (service === RascalConfigServices.SnapshotService) {
    copyConfigs(allExchanges, vhostConfig.exchanges, [
      types_1.RascalExchanges.SnapshotListener,
    ]);
    copyConfigs(allQueues, vhostConfig.queues, [
      types_1.RascalQueues.SnapshotListener,
    ]);
    copyConfigs(allBindings, vhostConfig.bindings, [
      types_1.RascalBindings.SnapshotListener,
    ]);
    copyConfigs(allPublications, vhostConfig.publications, [
      types_1.RascalPublications.SnapshotListener,
    ]);
    copyConfigs(allSubscriptions, vhostConfig.subscriptions, [
      types_1.RascalSubscriptions.SnapshotListener,
    ]);
  } else if (service === RascalConfigServices.DiscobotService) {
    copyConfigs(allExchanges, vhostConfig.exchanges, [
      types_1.RascalExchanges.Discobot,
    ]);
    copyConfigs(allQueues, vhostConfig.queues, [
      types_1.RascalQueues.DiscordListener,
    ]);
    copyConfigs(allBindings, vhostConfig.bindings, [
      types_1.RascalBindings.DiscordListener,
    ]);
    copyConfigs(allPublications, vhostConfig.publications, [
      types_1.RascalPublications.DiscordListener,
    ]);
    copyConfigs(allSubscriptions, vhostConfig.subscriptions, [
      types_1.RascalSubscriptions.DiscordListener,
    ]);
  }
  return config;
}
exports.getRabbitMQConfig = getRabbitMQConfig;
