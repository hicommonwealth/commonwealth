import type * as Rascal from 'rascal';
import { RabbitMQControllerError } from './rabbitMQController';
import type {
  RascalPublications,
  RascalSubscriptions,
  TRmqMessages,
} from './types';
import { AbstractRabbitMQController, RmqMsgFormatError } from './types';

/**
 * This is a mock RabbitMQController whose functions simply log a 'success' message when called. Used mainly for
 * testing and scripts that need to use eventHandlers without a live RabbitMQ instance.
 */
export class MockRabbitMQController extends AbstractRabbitMQController {
  private _queuedMessages = {};
  private subscribedIntervals: Partial<
    Record<RascalSubscriptions, NodeJS.Timeout>
  >[] = [];

  constructor(private readonly _rabbitMQConfig: Rascal.BrokerConfig) {
    super();
  }

  public async init(): Promise<void> {
    if (this._initialized === true) {
      throw new RabbitMQControllerError(
        'RabbitMQController is already initialized!',
      );
    }

    this._initialized = true;

    const config =
      this._rabbitMQConfig.vhosts[Object.keys(this._rabbitMQConfig.vhosts)[0]];

    // initialize the message queue arrays
    for (const subName of Object.keys(config.subscriptions)) {
      this._queuedMessages[subName] = [];
    }
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
    msgProcessorContext?: { [key: string]: any },
  ): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError(
        'RabbitMQController is not initialized!',
      );
    }

    // process existing messages
    await this.runMessageProcessor(
      messageProcessor,
      this._queuedMessages[subscriptionName],
      msgProcessorContext,
    );

    const checkQueues = async () => {
      if (this._queuedMessages[subscriptionName].length > 0) {
        await this.runMessageProcessor(
          messageProcessor,
          this._queuedMessages[subscriptionName],
          msgProcessorContext,
        );
      }
    };

    // setup func which checks every second whether a new message has been added to the fake queue (array)
    // we could set up a proxy trigger when a message is published but then error handling would fall to the publisher
    // rather than the subscriber which is not the case in production.
    const interval = setInterval(checkQueues.bind(this), 1000);
    this.subscribedIntervals.push({
      [subscriptionName]: interval,
    });

    console.log('Subscription started');
    return;
  }

  public async publish(
    data: TRmqMessages,
    publisherName: RascalPublications,
  ): Promise<any> {
    if (!this._initialized) {
      throw new RabbitMQControllerError(
        'RabbitMQController is not initialized!',
      );
    }
    const subscription = this.routeMessage(publisherName);
    this._queuedMessages[subscription].push(data);
    console.log('Message published');
  }

  public async safePublish(
    publishData: TRmqMessages,
    objectId: number | string,
    publication: RascalPublications,
    // DB?: any,
  ) {
    await this.publish(publishData, publication);
  }

  public get initialized(): boolean {
    return this._initialized;
  }

  public async shutdown() {
    this._initialized = false;
    // clear the fake queues
    this._queuedMessages = {};
    // reset intervals
    for (const interval of this.subscribedIntervals) {
      clearInterval(Object.values(interval)[0]);
    }
    this.subscribedIntervals = [];
  }

  private routeMessage(publication: RascalPublications): RascalSubscriptions {
    const config =
      this._rabbitMQConfig.vhosts[Object.keys(this._rabbitMQConfig.vhosts)[0]];
    const { exchange, routingKey } = config.publications[publication];
    const queue = (
      Object.values(config.bindings).find(
        (binding: Rascal.BindingConfig) =>
          binding.source === exchange && binding.bindingKey === routingKey,
      ) as Rascal.BindingConfig
    ).destination;

    if (!queue) {
      throw new Error(
        'Routing Failed: Could not find a queue that matches the given publication',
      );
    }

    for (const [subName, sub] of Object.entries(config.subscriptions)) {
      if (sub.queue === queue) return subName as RascalSubscriptions;
    }

    throw new Error(
      'Routing Failed: Could not find a subscription that matches the given publication',
    );
  }

  private async runMessageProcessor(
    messageProcessor: (data: TRmqMessages, ...args: any) => Promise<void>,
    messages: any[],
    msgProcessorContext?: { [key: string]: any },
  ) {
    const numMessages = messages.length;
    for (let i = 0; i < numMessages; i++) {
      const message = messages.shift();
      try {
        await messageProcessor.call(
          { rmqController: this, ...msgProcessorContext },
          message,
        );
      } catch (e) {
        const errorMsg = `
              Failed to process message: ${JSON.stringify(message)} 
              with processor function ${messageProcessor.name}.
            `;
        // if the message processor throws because of a message formatting error then we immediately deadLetter the
        // message to avoid re-queuing the message multiple times
        if (e instanceof RmqMsgFormatError) {
          throw new Error(
            `Negative Acknowledgement: Invalid Message Format Error - ${errorMsg}`,
          );
        } else {
          throw new Error(
            `Negative Acknowledgement: Unknown Error - Message would be re-queued in production`,
          );
        }
      }
    }
  }

  public get queuedMessages() {
    return this._queuedMessages;
  }
}
