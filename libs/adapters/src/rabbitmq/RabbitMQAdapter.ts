import {
  Broker,
  BrokerPublications,
  BrokerSubscriptions,
  EventContext,
  EventSchemas,
  Events,
  EventsHandlerMetadata,
  ILogger,
  InvalidInput,
  RetryStrategyFn,
  handleEvent,
  logger,
} from '@hicommonwealth/core';
import { Message } from 'amqplib';
import { AckOrNack, default as Rascal } from 'rascal';
import { fileURLToPath } from 'url';

const defaultRetryStrategy: RetryStrategyFn = (
  err: Error | undefined,
  topic: BrokerSubscriptions,
  content: any,
  ackOrNackFn: AckOrNack,
  log: ILogger,
) => {
  if (err instanceof InvalidInput) {
    log.error(`Invalid event`, err, {
      topic,
      message: content,
    });
    ackOrNackFn(err, { strategy: 'nack' });
  } else {
    log.error(`Failed to process event`, err, {
      topic,
      message: content,
    });
    ackOrNackFn(err, [
      { strategy: 'republish', defer: 2000, attempts: 3 },
      { strategy: 'nack' },
    ]);
  }
};

export class RabbitMQAdapter implements Broker {
  protected _initialized = false;

  public broker: Rascal.BrokerAsPromised | undefined;
  public readonly subscribers: string[];
  public readonly publishers: string[];
  protected readonly _rawVhost: any;
  private _log: ILogger;

  constructor(protected readonly _rabbitMQConfig: Rascal.BrokerConfig) {
    const __filename = fileURLToPath(import.meta.url);
    this._log = logger(__filename);
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

  public async publish<Name extends Events>(
    topic: BrokerPublications,
    event: EventContext<Name>,
  ): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const logContext = {
      topic,
      event,
    };

    if (!this.publishers.includes(topic)) {
      this._log.error(
        `${topic} not supported by this adapter instance`,
        undefined,
        {
          ...logContext,
          rascalPublication: topic,
        },
      );
      return false;
    }

    try {
      const publication = await this.broker!.publish(topic, event, {
        routingKey: event.name,
      });

      return new Promise<boolean>((resolve, reject) => {
        publication.on('success', (messageId) => {
          this._log.debug('Message published', {
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
          publication: topic,
        },
      );
    }

    return false;
  }

  public async subscribe(
    topic: BrokerSubscriptions,
    handler: EventsHandlerMetadata<EventSchemas>,
    retryStrategy?: RetryStrategyFn,
  ): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    if (!this.subscribers.includes(topic)) {
      this._log.error(
        `${topic} not supported by this adapter instance`,
        undefined,
        {
          topic,
          rascalSubscription: topic,
        },
      );
      return false;
    }

    try {
      this._log.info(`${this.name} subscribing to ${topic}`);
      const subscription = await this.broker!.subscribe(topic);

      subscription.on(
        'message',
        (_message: Message, content: any, ackOrNackFn: AckOrNack) => {
          handleEvent(handler, content, true)
            .then(() => {
              this._log.debug('Message Acked', {
                topic,
                message: content,
              });
              ackOrNackFn();
            })
            .catch((err: Error | undefined) => {
              if (retryStrategy)
                retryStrategy(err, topic, content, ackOrNackFn, this._log);
              else
                defaultRetryStrategy(
                  err,
                  topic,
                  content,
                  ackOrNackFn,
                  this._log,
                );
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
