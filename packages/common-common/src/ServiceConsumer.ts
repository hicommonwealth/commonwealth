// @ts-ignore
import crypto from "crypto";
import { addPrefix, factory, formatFilename } from "./logging";
import { RabbitMQController, RascalSubscriptions } from "./rabbitmq";
import Rollbar from "rollbar";
import { Logger } from "typescript-logging";

export type RabbitMQSubscription = {
  messageProcessor: (data: any) => Promise<any>;
  subscriptionName: RascalSubscriptions;
  msgProcessorContext?: { [key: string]: any };
};

export class ServiceConsumer {
  public readonly serviceName: string;
  public readonly serviceId: string;
  public readonly rabbitMQController: RabbitMQController;
  public readonly subscriptions: RabbitMQSubscription[];
  private _initialized = false;
  protected rollbar: Rollbar;
  private log: Logger;

  constructor(
    _serviceName: string,
    _rabbitmqController: RabbitMQController,
    _subscriptions: RabbitMQSubscription[],
    rollbar?: Rollbar
  ) {
    this.serviceName = _serviceName;
    // TODO: make this deterministic somehow
    this.serviceId = crypto.randomBytes(10).toString("hex");
    this.subscriptions = _subscriptions;

    // setup logger
    this.log = factory.getLogger(
      addPrefix(formatFilename(__filename), [this.serviceName, this.serviceId])
    );

    this.rabbitMQController = _rabbitmqController;
    this.rollbar = rollbar;
  }

  public async init(): Promise<void> {
    this.log.info(
      `Initializing service-consumer: ${this.serviceName}-${this.serviceId}`
    );

    if (!this.rabbitMQController.initialized) {
      try {
        await this.rabbitMQController.init();
      } catch (e) {
        this.log.error("Failed to initialize the RabbitMQ Controller", e);
        this.rollbar?.error("Failed to initialize the RabbitMQ Controller", e);
      }
    }

    // start all the subscriptions for this consumer
    for (const sub of this.subscriptions) {
      try {
        await this.rabbitMQController.startSubscription(
          sub.messageProcessor,
          sub.subscriptionName,
          sub.msgProcessorContext
        );
        console.log('subscribed to', sub.subscriptionName);
      } catch (e) {
        this.log.error(
          `Failed to start the '${sub.subscriptionName}' subscription with the '${sub.messageProcessor.name}' ` +
            `processor function using context: ${JSON.stringify(
              sub.msgProcessorContext
            )}`,
          e
        );
        this.rollbar?.critical(
          `Failed to start the '${sub.subscriptionName}' subscription with the '${sub.messageProcessor.name}' ` +
            `processor function using context: ${JSON.stringify(
              sub.msgProcessorContext
            )}`,
          e
        );
      }
    }

    this._initialized = true;
  }

  public async shutdown(): Promise<void> {
    this.log.info(
      `Service Consumer ${this.serviceName}:${this.serviceId} shutting down...`
    );
    if (this.rabbitMQController.initialized) {
      this.log.info("Attempting to shutdown RabbitMQ Broker...");
      await this.rabbitMQController.shutdown();
    }

    // any other future clean-up + logging

    this._initialized = false;
    this.log.info(
      `Service Consumer ${this.serviceName}:${this.serviceId} shut down successful`
    );
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
