import { DB } from '@hicommonwealth/model';
import {
  GetStatsOptions,
  GetStatsResult,
  __getStats,
} from './server_admin_methods/get_stats';
import {
  GetTopUsersOptions,
  GetTopUsersResult,
  __getTopUsers,
} from './server_admin_methods/get_top_users';

export class ServerAdminController {
  constructor(public models: DB) {}

  async getStats(options: GetStatsOptions): Promise<GetStatsResult> {
    return __getStats.call(this, options);
  }

  async getTopUsers(options: GetTopUsersOptions): Promise<GetTopUsersResult> {
    return __getTopUsers.call(this, options);
  }
}
