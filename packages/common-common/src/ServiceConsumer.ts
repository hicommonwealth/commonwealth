// @ts-ignore
import crypto from "crypto";
import { addPrefix, factory, formatFilename } from "./logging";
import { RabbitMQController } from "./rabbitmq/rabbitMQController";
import getRabbitMQConfig from "./rabbitmq/RabbitMQConfig";
import { RascalSubscriptions } from "./rabbitmq/types";

let log;

type subscription = {
  messageProcessor: (data: any) => Promise<any>;
  subscriptionName: RascalSubscriptions;
};

export class ServiceConsumer {
  public readonly serviceName: string;
  public readonly serviceId: string;
  public readonly rabbitMQController: RabbitMQController;
  public readonly subscriptions: subscription[];

  constructor(
    _serviceName: string,
    _rabbitmqUri: string,
    _subscriptions: subscription[]
  ) {
    this.serviceName = _serviceName;
    // TODO: make this deterministic somehow
    this.serviceId = crypto.randomBytes(10).toString("hex");
    this.subscriptions = _subscriptions;

    // setup logger
    log = factory.getLogger(
      addPrefix(formatFilename(__filename), [this.serviceName, this.serviceId])
    );

    // create RabbitMQController instance
    this.rabbitMQController = new RabbitMQController(
      getRabbitMQConfig(_rabbitmqUri)
    );
  }

  public async init(): Promise<void> {
    log.info(`Starting the ${this.serviceName}-${this.serviceId} consumer`);

    try {
      // initialize RabbitMQ and start all the subscriptions for this consumer
      await this.rabbitMQController.init();
      for (const sub of this.subscriptions) {
        await this.rabbitMQController.startSubscription(
          sub.messageProcessor,
          RascalSubscriptions[sub.subscriptionName]
        );
      }
    } catch (e) {
      log.error("A critical error occurred.", e);
      // TODO: rollbar error reporting
    }
  }
}
