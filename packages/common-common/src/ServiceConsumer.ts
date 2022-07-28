// @ts-ignore
import crypto from "crypto";
import { addPrefix, factory, formatFilename } from "./logging";
import { RabbitMQController } from "./rabbitmq/rabbitMQController";
import getRabbitMQConfig from "./rabbitmq/RabbitMQConfig";

let log;

export class ServiceConsumer {
  public readonly serviceName: string;
  public readonly serviceId: string;
  public readonly RabbitMQController: RabbitMQController

  constructor(readonly _serviceName: string, rabbitmqUri: string) {
    // description variables
    this.serviceName = _serviceName;
    this.serviceId = crypto.randomBytes(10).toString('hex');

    // setup logger
    log = factory.getLogger(addPrefix(formatFilename(__filename), [this.serviceName, this.serviceId]));

    // create RabbitMQController instance
    this.RabbitMQController = new RabbitMQController(getRabbitMQConfig(rabbitmqUri));
  }

  public async init(): Promise<void> {
    log.info(`Starting the ${this.serviceName}-${this.serviceId} consumer`);
  }
}
