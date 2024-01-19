import { ILogger, logger } from '@hicommonwealth/core';
import crypto from 'crypto';
import Rollbar from 'rollbar';
import type {
  AbstractRabbitMQController,
  RascalSubscriptions,
  TRmqMessages,
} from '.';

export type RabbitMQSubscription = {
  messageProcessor: (data: TRmqMessages, ...args: any) => Promise<void>;
  subscriptionName: RascalSubscriptions;
  msgProcessorContext?: { [key: string]: any };
};

/**
 * This class is a general wrapper around RabbitMQ functionality. It initializes a RabbitMQ Controller and all the
 * subscriptions that are passed. The subscriptions are held as state within the class, leaving room for future work
 * to get insight into active subscriptions or for managing the currently active subscriptions. The class also
 * initializes a logger instance with a prefix that helps identify exactly where the log came from in a multi-server
 * architecture.
 */
export class ServiceConsumer {
  public readonly serviceName: string;
  public readonly serviceId: string;
  public readonly rabbitMQController: AbstractRabbitMQController;
  public readonly subscriptions: RabbitMQSubscription[];
  private _initialized = false;
  protected rollbar: Rollbar;
  private log: ILogger;

  constructor(
    _serviceName: string,
    _rabbitmqController: AbstractRabbitMQController,
    _subscriptions: RabbitMQSubscription[],
    rollbar?: Rollbar,
  ) {
    this.serviceName = _serviceName;
    // TODO: make this deterministic somehow
    this.serviceId = crypto.randomBytes(10).toString('hex');
    this.subscriptions = _subscriptions;

    // setup logger
    this.log = logger().getLogger(__filename, this.serviceName, this.serviceId);

    this.rabbitMQController = _rabbitmqController;
    this.rollbar = rollbar;
  }

  public async init(): Promise<void> {
    this.log.info(
      `Initializing service-consumer: ${this.serviceName}-${this.serviceId}`,
    );

    if (!this.rabbitMQController.initialized) {
      try {
        await this.rabbitMQController.init();
      } catch (e) {
        this.log.error('Failed to initialize the RabbitMQ Controller', e);
        this.rollbar?.error('Failed to initialize the RabbitMQ Controller', e);
      }
    }

    // start all the subscriptions for this consumer
    for (const sub of this.subscriptions) {
      try {
        await this.rabbitMQController.startSubscription(
          sub.messageProcessor,
          sub.subscriptionName,
          sub.msgProcessorContext,
        );
        console.log('subscribed to', sub.subscriptionName);
      } catch (e) {
        this.log.error(
          `Failed to start the '${sub.subscriptionName}' subscription with the '${sub.messageProcessor}' ` +
            `processor function using context: ${JSON.stringify(
              sub.msgProcessorContext,
            )}`,
          e,
        );
        this.rollbar?.critical(
          `Failed to start the '${sub.subscriptionName}' subscription with the '${sub.messageProcessor}' ` +
            `processor function using context: ${JSON.stringify(
              sub.msgProcessorContext,
            )}`,
          e,
        );
      }
    }
    this._initialized = true;
  }

  public async shutdown(): Promise<void> {
    this.log.info(
      `Service Consumer ${this.serviceName}:${this.serviceId} shutting down...`,
    );
    if (this.rabbitMQController.initialized) {
      this.log.info('Attempting to shutdown RabbitMQ Broker...');
      await this.rabbitMQController.shutdown();
    }

    // any other future clean-up + logging

    this._initialized = false;
    this.log.info(
      `Service Consumer ${this.serviceName}:${this.serviceId} shut down successful`,
    );
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
