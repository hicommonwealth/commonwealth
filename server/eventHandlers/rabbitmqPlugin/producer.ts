import Rascal from 'rascal';

export class RabbitMqProducer {
  protected broker;
  public readonly publishers;
  public readonly _vhost;

  constructor(private readonly _rabbitMQConfig: any) {
    // sets _vhost as the first vhost in the configuration passed
    this._vhost =
      _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];

    // array of publishers
    this.publishers = Object.keys(this._vhost.publications);
  }

  public async init(): Promise<void> {
    console.info(`Rascal connecting to RabbitMQ: ${this._vhost.connection}`);
    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig)
    );

    this.broker.on('error', console.error);
    this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
      console.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`
      );
    });
    this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
      console.info(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`
      );
    });
    this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
      console.info(
        `Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`
      );
    });
  }

  public async publish(data: any, publisherName: string): Promise<any> {
    if (!this.publishers.includes(publisherName))
      throw new Error('Publisher is not defined');

    try {
      const publication = await this.broker.publish(publisherName, data);
      publication.on('error', (err, messageId) => {
        console.error(`Publisher error ${err}, ${messageId}`);
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }
}
