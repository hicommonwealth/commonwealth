import { StatsD } from 'hot-shots';

export enum StatsDTag {
  Commonwealth = "commonwealth",
  TokenBalanceCache = "token-balance-cache",
}

// Singleton containing map of tag to StatsD instance, allows us to keep track of stats for different components
export class StatsDController {
  private static instance: StatsDController = new StatsDController();

  private _client: Map<StatsDTag, StatsD>;

  private constructor() {
    // Create map each of the StatsDTag enum to its own StatsD instance.
    this._client = new Map(Object.values(StatsDTag).map((key: StatsDTag) => [key, this.createStatsD(key)]));
  }

  private createStatsD(project: StatsDTag): StatsD {
    return new StatsD({
      globalTags: {env: process.env.NODE_ENV || 'development', project: project},
      errorHandler: (error) => {
        console.error(`Caught statsd socket error: ${error}`);
      }
    })
  }

  public static get(project: StatsDTag): StatsD {
    return this.instance._client.get(project);
  }
}
