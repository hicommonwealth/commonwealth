import { StatsD } from 'hot-shots';

export enum ProjectTag {
  Commonwealth = 'commonwealth',
  TokenBalanceCache = 'token-balance-cache',
}

export class StatsDController {
  private static instance: StatsDController = new StatsDController();

  private _client: StatsD;

  private constructor() {
    this._client = new StatsD({
      globalTags: { env: process.env.NODE_ENV || 'development' },
      errorHandler: (error) => {
        console.error(`Caught statsd socket error: ${error}`);
      },
    });
  }

  public static get(): StatsD {
    return this.instance._client;
  }
}
