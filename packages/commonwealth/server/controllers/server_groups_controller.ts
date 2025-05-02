import { DB } from '@hicommonwealth/model';
import {
  GetGroupsOptions,
  GetGroupsResult,
  __getGroups,
} from './server_groups_methods/get_groups';

/**
 * Implements methods related to groups
 */
export class ServerGroupsController {
  constructor(public models: DB) {}

  async getGroups(options: GetGroupsOptions): Promise<GetGroupsResult> {
    return __getGroups.call(this, options);
  }
}
