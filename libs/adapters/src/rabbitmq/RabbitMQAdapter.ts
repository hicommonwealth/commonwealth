import {
  Broker,
  CustomRetryStrategyError,
  EventContext,
  EventSchemas,
  EventsHandlerMetadata,
  ILogger,
  InvalidInput,
  RetryStrategyFn,
  RoutingKey,
  RoutingKeyTags,
  handleEvent,
  logger,
} from '@hicommonwealth/core';
import { Events } from '@hicommonwealth/schemas';
import { Message } from 'amqplib';
import { AckOrNack, default as Rascal } from 'rascal';

/**
 * Build a retry strategy function based on custom retry strategies map.
 *
 * @param {Function} customRetryStrategiesMap - A function which maps errors to retry strategies. The function should
 * return `true` if an error was successfully mapped to a strategy and `false` otherwise.
 * @param defaultDefer
 * @param defaultAttempts
 * @returns {RetryStrategyFn} The built retry strategy function.
 */
export function buildRetryStrategy(
  customRetryStrategiesMap?: (...args: Parameters<RetryStrategyFn>) => boolean,
  defaultDefer: number = 2000,
  defaultAttempts: number = 3,
): RetryStrategyFn {
  return function (
    err: Error | InvalidInput | CustomRetryStrategyError,
    topic: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    ackOrNackFn: AckOrNack,
    log: ILogger,
  ) {
    const logContext = {
      topic,
      message: content,
    };

    if (err instanceof InvalidInput) {
      log.error(`Invalid event`, err, logContext);
      ackOrNackFn(err, { strategy: 'nack' });
      return;
    } else if (err instanceof CustomRetryStrategyError) {
      log.error(err.message, err, logContext);
      ackOrNackFn(err, err.recoveryStrategy);
      return;
    }

    let res = false;
    if (customRetryStrategiesMap) {
      res = customRetryStrategiesMap(err, topic, content, ackOrNackFn, log);
    }

    if (!res) {
      log.error(`Failed to process event`, err, logContext);
      ackOrNackFn(err, [
        {
          strategy: 'republish',
          defer: defaultDefer,
          attempts: defaultAttempts,
        },
        { strategy: 'nack' },
      ]);
      return;
    }
  };
}

const defaultRetryStrategy = buildRetryStrategy();

export class RabbitMQAdapter implements Broker {
  protected _initialized = false;

  public broker: Rascal.BrokerAsPromised | undefined;
  public readonly subscribers: string[];
  public readonly publishers: string[];
  protected readonly _rawVhost: any;
  private readonly _log: ILogger;

  constructor(protected readonly _rabbitMQConfig: Rascal.BrokerConfig) {
    this._log = logger(import.meta);
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
    event: EventContext<Name>,
  ): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const topic = 'MessageRelayer';

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
        routingKey: this.getRoutingKey(event),
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
    consumer: () => EventsHandlerMetadata<EventSchemas>,
    retryStrategy?: RetryStrategyFn,
    hooks?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeHandleEvent: (topic: string, event: any, context: any) => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterHandleEvent: (topic: string, event: any, context: any) => void;
    },
  ): Promise<boolean> {
    const topic = consumer.name;

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

    const handler = consumer();

    try {
      this._log.info(`${this.name} subscribing to ${topic}`);
      const subscription = await this.broker!.subscribe(topic);

      subscription.on(
        'message',
        (
          _message: Message,
          content: EventContext<Events>,
          ackOrNackFn: AckOrNack,
        ) => {
          const { beforeHandleEvent, afterHandleEvent } = hooks || {};
          const context: unknown = {};
          try {
            beforeHandleEvent?.(topic, content, context);
          } catch (err) {
            this._log.error(
              `beforeHandleEvent failed on topic ${topic}`,
              err as Error,
            );
          }
          handleEvent(handler, content, true)
            .then(() => {
              this._log.debug('Message Acked', {
                topic,
                message: content,
              });
              ackOrNackFn();
            })
            .catch((err: Error) => {
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
            })
            .finally(() => {
              try {
                afterHandleEvent?.(topic, content, context);
              } catch (err) {
                this._log.error(
                  `afterHandleEvent failed on topic ${topic}`,
                  err as Error,
                );
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

  public getRoutingKey<Name extends Events>(
    event: EventContext<Name>,
  ): RoutingKey {
    if (
      (event.name === 'ThreadCreated' || event.name === 'ThreadUpvoted') &&
      'contestManagers' in event.payload &&
      event.payload.contestManagers?.length
    ) {
      return `${event.name}.${RoutingKeyTags.Contest}`;
    } else {
      return `${event.name}`;
    }
  }

  public get name(): string {
    return 'RabbitMQAdapter';
  }

  public async dispose(): Promise<void> {
    await this.broker?.shutdown();
    this._initialized = false;
  }

  public get initialized(): boolean {
    return this._initialized;
  }
}
