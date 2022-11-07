import {RabbitMQController, RabbitMQControllerError} from "./rabbitMQController";
import * as Rascal from "rascal";
import {RascalPublications, RascalSubscriptions, TRmqMessages} from "./types";
import {Sequelize} from "sequelize";


/**
 * This is a mock RabbitMQController whose functions simply log a 'success' message when called. Used mainly for
 * testing and scripts that need to use eventHandlers without a live RabbitMQ instance.
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

  public get initialized(): boolean {
    return this._initialized;
  }
}
