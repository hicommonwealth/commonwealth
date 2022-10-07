import {RabbitMQController, RabbitMQControllerError, SafeRmqPublishSupported} from "./rabbitMQController";
import * as Rascal from "rascal";
import {RascalPublications, RascalSubscriptions, TRmqMessages} from "./types";
import {Sequelize} from "sequelize";


/**
 * This is a mock RabbitMQController whose functions simply log a 'success' message when called. Used mainly for
 * testing.
 */
export class MockRabbitMQController extends RabbitMQController {
  constructor(_rabbitMQConfig: Rascal.BrokerConfig) {
    super(_rabbitMQConfig);
  }

  public async init(): Promise<void> {
    this._initialized = true;
  }

  /**
   * This function subscribes to a subscription defined in the RabbitMQ/Rascal config
   * @param messageProcessor The function to run for every message
   * @param subscriptionName The name of the subscription from the RabbitMQ/Rascal config file to start
   * @param msgProcessorContext An object containing the context that should be
   * used when calling the messageProcessor function
   */
  public async startSubscription(
    messageProcessor: (data: TRmqMessages, ...args: any) => Promise<void>,
    subscriptionName: RascalSubscriptions,
    msgProcessorContext?: { [key: string]: any }
  ): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError("RabbitMQController is not initialized!")
    }
    console.log("Subscription started")
    return;
  }

  // TODO: add a class property that takes an object from publisherName => callback function
  //      if a message is successfully published to a particular queue then the callback is executed

  // TODO: the publish ACK should be in a transaction with the publish itself
  public async publish(data: TRmqMessages, publisherName: RascalPublications): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError("RabbitMQController is not initialized!")
    }
    console.log("Message published")
  }

  /**
   * This function implements a method of publishing that guarantees eventual consistency. The function assumes that a
   * data record has already been entered in the source database, and now we need to publish a part of this data
   * record to a queue. Eventual consistency is achieved specifically by the 'queued' column of the data records. That
   * is, if the message is successfully published to the required queue, the 'queued' column is updated to reflect this.
   * If the update to the queue column fails then the message is not published and is left to be re-published by the
   * background job RepublishMessage.
   * @param publishData The content of the message to send
   * @param objectId The id of the data record in the source database
   * @param publication {RascalPublications} The Rascal publication (aka queue) to send the message to
   * @param DB {sequelize: Sequelize, model: SafeRmqPublishSupported} An object containing a sequelize connection/object
   *  and the sequelize model static which contains the objectId.
   */
  public async safePublish(
    publishData: TRmqMessages,
    objectId: number | string,
    publication: RascalPublications,
    DB: { sequelize: Sequelize, model: SafeRmqPublishSupported }
  ) {
    if (!this._initialized) {
      throw new RabbitMQControllerError("RabbitMQController is not initialized!")
    }

    console.log("Message publish confirmed");
    return;
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
