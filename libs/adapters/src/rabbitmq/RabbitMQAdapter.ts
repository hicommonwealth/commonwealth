import {
  Broker,
  BrokerTopics,
  EventContext,
  EventSchemas,
  EventsHandlerMetadata,
  ILogger,
  InvalidInput,
  eventHandler,
  logger,
  schemas,
} from '@hicommonwealth/core';
import { Message } from 'amqplib';
import * as Rascal from 'rascal';
import { AckOrNack } from 'rascal';
import { RascalPublications, RascalSubscriptions } from './types';

const BrokerTopicPublicationMap = {
  [BrokerTopics.DiscordListener]: RascalPublications.DiscordListener,
  [BrokerTopics.SnapshotListener]: RascalPublications.SnapshotListener,
};

const BrokerTopicSubscriptionMap = {
  [BrokerTopics.DiscordListener]: RascalSubscriptions.DiscordListener,
  [BrokerTopics.SnapshotListener]: RascalSubscriptions.SnapshotListener,
};

export class RabbitMQAdapter implements Broker {
  protected _initialized = false;

  public broker: Rascal.BrokerAsPromised | undefined;
  public readonly subscribers: string[];
  public readonly publishers: string[];
  protected readonly _rawVhost: any;
  private _log: ILogger;

  constructor(protected readonly _rabbitMQConfig: Rascal.BrokerConfig) {
    this._log = logger().getLogger(__filename);
    this._rawVhost =
      _rabbitMQConfig.vhosts![Object.keys(_rabbitMQConfig.vhosts!)[0]];
    this.subscribers = Object.keys(this._rawVhost.subscriptions);
    this.publishers = Object.keys(this._rawVhost.publications);
  }

  public async init(): Promise<void> {
    this._log.info(
      `Rascal connecting to RabbitMQ: ${this._rawVhost.connection}`,
    );

    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig),
    );

    this.broker.on('error', (err, { vhost, connectionUrl }) => {
      this._log.error(
        `Broker error on vhost: ${vhost} using url: ${connectionUrl}`,
        err,
      );
    });
    this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
      this._log.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`,
      );
    });
    this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
      this._log.warn(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`,
      );
    });
    this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
      this._log.info(
        `Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`,
      );
    });

    this._initialized = true;
  }

  public async publish<Name extends schemas.Events>(
    topic: BrokerTopics,
    event: EventContext<Name>,
  ): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const logContext = {
      topic,
      event,
    };

    const rascalPubName: RascalPublications | undefined =
      BrokerTopicPublicationMap[topic];
    if (!rascalPubName) {
      this._log.error(
        `Unsupported event: ${event.name}`,
        undefined,
        logContext,
      );
      return false;
    }

    if (!this.publishers.includes(rascalPubName)) {
      this._log.error(
        `${rascalPubName} not supported by this adapter instance`,
        undefined,
        {
          ...logContext,
          rascalPublication: rascalPubName,
        },
      );
      return false;
    }

    const schema = schemas.events[event.name];
    const validationResult = schema.safeParse(event.payload);
    if (!validationResult.success) {
      this._log.error(
        'Event schema validation failed',
        validationResult.error,
        logContext,
      );
      return false;
    }

    try {
      const publication = await this.broker!.publish(rascalPubName, event);

      return new Promise<boolean>((resolve, reject) => {
        publication.on('success', (messageId) => {
          this._log.debug('Message published', undefined, {
            messageId,
            ...logContext,
          });
          resolve(true);
        });
        // errors that occur after RabbitMQ has acknowledged the message
        publication.on('error', (err, messageId) => {
          this._log.error(`Publisher error ${messageId}`, err, {
            messageId,
            ...logContext,
          });
          reject(false);
        });
      });
    } catch (e) {
      this._log.fatal(
        'Publication does not exist',
        e instanceof Error ? e : undefined,
        {
          ...logContext,
          publication: rascalPubName,
        },
      );
    }

    return false;
  }

  public async subscribe(
    topic: BrokerTopics,
    handler: EventsHandlerMetadata<EventSchemas>,
  ): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const rascalSubName = BrokerTopicSubscriptionMap[topic];
    if (!rascalSubName) {
      this._log.error(`Unsupported topic`, undefined, { topic });
      return false;
    }

    if (!this.subscribers.includes(rascalSubName)) {
      this._log.error(
        `${rascalSubName} not supported by this adapter instance`,
        undefined,
        {
          topic,
          rascalSubscription: rascalSubName,
        },
      );
      return false;
    }

    try {
      this._log.info(`${this.name} subscribing to ${rascalSubName}`);
      const subscription = await this.broker!.subscribe(rascalSubName);

      subscription.on(
        'message',
        (_message: Message, content: any, ackOrNackFn: AckOrNack) => {
          eventHandler(handler, content)
            .then(() => {
              this._log.debug('Message Acked', undefined, {
                topic,
                message: content,
              });
              ackOrNackFn();
            })
            .catch((err: Error | undefined) => {
              if (err instanceof InvalidInput) {
                this._log.error(`Invalid event`, err, {
                  topic,
                  message: content,
                });
                ackOrNackFn(err, { strategy: 'nack' });
              } else {
                this._log.error(`Failed to process event`, err, {
                  topic,
                  message: content,
                });
                ackOrNackFn(err, [
                  { strategy: 'republish', defer: 2000, attempts: 3 },
                  { strategy: 'nack' },
                ]);
              }
            });
        },
      );
      subscription.on('error', (err) => {
        this._log.error(`Subscription failure`, err, {
          topic,
        });
      });
      subscription.on('invalid_content', (err, message, ackOrNack) => {
        this._log.error(`Invalid content`, err, {
          topic,
          message,
        });
        ackOrNack(err, { strategy: 'nack' });
      });
      return true;
    } catch (err) {
      this._log.fatal(
        `Failed to subscribe to ${topic}`,
        err instanceof Error ? err : undefined,
        {
          topic,
        },
      );
    }

    return false;
  }

  public get name(): string {
    return 'RabbitMQAdapter';
  }

  public async dispose(): Promise<void> {
    await this.broker!.shutdown();
    this._initialized = false;
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
