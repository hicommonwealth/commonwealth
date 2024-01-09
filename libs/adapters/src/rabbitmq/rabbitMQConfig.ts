import type * as Rascal from 'rascal';
import { getAllRascalConfigs } from './configuration/rascalConfig';
import {
  RascalBindings,
  RascalExchanges,
  RascalPublications,
  RascalQueues,
  RascalSubscriptions,
} from './types';

// TODO: Move configs to specific services

export enum RascalConfigServices {
  CommonwealthService = 'commonwealth',
  SnapshotService = 'snapshot',
  DiscobotService = 'discobot',
}

/**
 * This function builds and returns the configuration json required by Rascal to properly setup and use RabbitMQ.
 * @param rabbitmq_uri The uri of the RabbitMQ instance to connect to.
 * @param service The service determining which config to return.
 */
export function getRabbitMQConfig(
  rabbitmq_uri: string,
  service: RascalConfigServices,
): Rascal.BrokerConfig {
  let vhost: string, purge: boolean;

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
  } = getAllRascalConfigs(rabbitmq_uri, vhost, purge);
  const config = baseConfig;
  const vhostConfig = config.vhosts[vhost];
  if (service === RascalConfigServices.CommonwealthService) {
    copyConfigs(allExchanges, vhostConfig.exchanges, [
      RascalExchanges.SnapshotListener,
      RascalExchanges.Discobot,
    ]);
    copyConfigs(allQueues, vhostConfig.queues, [
      RascalQueues.SnapshotListener,
      RascalQueues.DiscordListener,
    ]);
    copyConfigs(allBindings, vhostConfig.bindings, [
      RascalBindings.SnapshotListener,
      RascalBindings.DiscordListener,
    ]);
    copyConfigs(allPublications, vhostConfig.publications, [
      RascalPublications.SnapshotListener,
      RascalPublications.DiscordListener,
    ]);
    copyConfigs(allSubscriptions, vhostConfig.subscriptions, [
      RascalSubscriptions.SnapshotListener,
      RascalSubscriptions.DiscordListener,
    ]);
  } else if (service === RascalConfigServices.SnapshotService) {
    copyConfigs(allExchanges, vhostConfig.exchanges, [
      RascalExchanges.SnapshotListener,
    ]);
    copyConfigs(allQueues, vhostConfig.queues, [RascalQueues.SnapshotListener]);
    copyConfigs(allBindings, vhostConfig.bindings, [
      RascalBindings.SnapshotListener,
    ]);
    copyConfigs(allPublications, vhostConfig.publications, [
      RascalPublications.SnapshotListener,
    ]);
    copyConfigs(allSubscriptions, vhostConfig.subscriptions, [
      RascalSubscriptions.SnapshotListener,
    ]);
  } else if (service === RascalConfigServices.DiscobotService) {
    copyConfigs(allExchanges, vhostConfig.exchanges, [
      RascalExchanges.Discobot,
    ]);
    copyConfigs(allQueues, vhostConfig.queues, [RascalQueues.DiscordListener]);
    copyConfigs(allBindings, vhostConfig.bindings, [
      RascalBindings.DiscordListener,
    ]);
    copyConfigs(allPublications, vhostConfig.publications, [
      RascalPublications.DiscordListener,
    ]);
    copyConfigs(allSubscriptions, vhostConfig.subscriptions, [
      RascalSubscriptions.DiscordListener,
    ]);
  }

  return config;
}
