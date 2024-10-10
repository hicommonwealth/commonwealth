import * as Rascal from 'rascal';
import { config as EnvConfig } from '../config';
import { getAllRascalConfigs } from './configuration/rascalConfig';
import {
  RascalBindings,
  RascalExchanges,
  RascalPublications,
  RascalQueues,
  RascalSubscriptions,
} from './types';

export enum RascalConfigServices {
  CommonwealthService = 'commonwealth',
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
    purge = !EnvConfig.BROKER.DISABLE_LOCAL_QUEUE_PURGE;
  } else {
    const count = (rabbitmq_uri.match(/\//g) || []).length;
    if (count == 3) {
      // this matches for a production URL
      const res = rabbitmq_uri.split('/');
      vhost = res[res.length - 1];
      purge = false;
    } else {
      throw new Error(
        "Can't create Rascal RabbitMQ Config with an invalid URI!",
      );
    }
  }

  type Keys =
    | RascalExchanges
    | RascalQueues
    | RascalBindings
    | RascalPublications
    | RascalSubscriptions;

  const copyConfigs = (source: any, target: any, keys: Array<Keys>) =>
    target && source && keys.forEach((key) => (target[key] = source[key]));

  const {
    baseConfig,
    allExchanges,
    allPublications,
    allSubscriptions,
    allQueues,
    allBindings,
  } = getAllRascalConfigs(rabbitmq_uri, vhost, purge);
  const config = baseConfig;
  const vhostConfig = config.vhosts![vhost];
  if (service === RascalConfigServices.CommonwealthService) {
    copyConfigs(allExchanges, vhostConfig.exchanges, [
      RascalExchanges.MessageRelayer,
    ]);
    copyConfigs(allQueues, vhostConfig.queues, [
      RascalQueues.ChainEvent,
      RascalQueues.NotificationsProvider,
      RascalQueues.NotificationsSettings,
      RascalQueues.ContestWorkerPolicy,
      RascalQueues.ContestProjection,
      RascalQueues.DiscordBotPolicy,
    ]);
    copyConfigs(allBindings, vhostConfig.bindings, [
      RascalBindings.ChainEvent,
      RascalBindings.NotificationsProvider,
      RascalBindings.NotificationsSettings,
      RascalBindings.ContestWorkerPolicy,
      RascalBindings.ContestProjection,
      RascalBindings.DiscordBotPolicy,
    ]);
    copyConfigs(allPublications, vhostConfig.publications, [
      RascalPublications.MessageRelayer,
    ]);
    copyConfigs(allSubscriptions, vhostConfig.subscriptions, [
      RascalSubscriptions.ChainEvent,
      RascalSubscriptions.NotificationsProvider,
      RascalSubscriptions.NotificationsSettings,
      RascalSubscriptions.ContestWorkerPolicy,
      RascalSubscriptions.ContestProjection,
      RascalSubscriptions.DiscordBotPolicy,
    ]);
  }

  return config;
}
