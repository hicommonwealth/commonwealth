import { DB } from '@hicommonwealth/model';
import {
  GetStatsOptions,
  GetStatsResult,
  __getStats,
} from './server_admin_methods/get_stats';

export class ServerAdminController {
  constructor(public models: DB) {}

  async getStats(options: GetStatsOptions): Promise<GetStatsResult> {
    return __getStats.call(this, options);
  }
}
