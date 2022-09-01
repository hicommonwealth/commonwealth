// @ts-ignore
import crypto from "crypto";
import { addPrefix, factory, formatFilename } from "./logging";
import { RabbitMQController, RascalSubscriptions } from "./rabbitmq";

let log;

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

  constructor(
    _serviceName: string,
    _rabbitmqController: RabbitMQController,
    _subscriptions: RabbitMQSubscription[]
  ) {
    this.serviceName = _serviceName;
    // TODO: make this deterministic somehow
    this.serviceId = crypto.randomBytes(10).toString("hex");
    this.subscriptions = _subscriptions;

    // setup logger
    log = factory.getLogger(
      addPrefix(formatFilename(__filename), [this.serviceName, this.serviceId])
    );

    this.rabbitMQController = _rabbitmqController;
  }

  public async init(): Promise<void> {
    log.info(`Initializing service-consumer: ${this.serviceName}-${this.serviceId}`);

    if (!this.rabbitMQController.initialized) {
      try {
        await this.rabbitMQController.init();
      } catch (e) {
        log.error("Failed to initialize the RabbitMQ Controller", e);
      }
    }

    try {
      // start all the subscriptions for this consumer
      for (const sub of this.subscriptions) {
        await this.rabbitMQController.startSubscription(
          sub.messageProcessor,
          sub.subscriptionName,
          sub.msgProcessorContext
        );
      }
    } catch (e) {
      log.error("A critical error occurred.", e);
      // TODO: rollbar error reporting
    }
  }
}
