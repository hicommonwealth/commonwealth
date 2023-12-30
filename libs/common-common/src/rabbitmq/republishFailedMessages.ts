import type { RabbitMQController } from './rabbitMQController';

export abstract class RepublishFailedMessages<DB> {
  private _timeoutHandle: NodeJS.Timeout;

  protected constructor(
    protected readonly _rmqController: RabbitMQController,
    protected readonly _models: DB,
    private readonly _intervalMS: number,
  ) {
    if (_intervalMS <= 0) {
      throw new Error('Interval (in milliseconds) must be greater than 0');
    }
    if (!_rmqController.initialized) {
      throw new Error('RabbitMQ Controller must be initialized');
    }
  }

  protected abstract job(): Promise<void>;

  public run() {
    this._timeoutHandle = global.setInterval(
      () => this.job(),
      this._intervalMS,
    );
  }

  public close() {
    clearInterval(this._timeoutHandle);
    this._timeoutHandle = undefined;
  }
}
