import { DB } from '@hicommonwealth/model';
import {
  GetGroupsOptions,
  GetGroupsResult,
  __getGroups,
} from './server_groups_methods/get_groups';
import {
  RefreshMembershipOptions,
  RefreshMembershipResult,
  __refreshMembership,
} from './server_groups_methods/refresh_membership';
import {
  UpdateGroupOptions,
  UpdateGroupResult,
  __updateGroup,
} from './server_groups_methods/update_group';

/**
 * Implements methods related to groups
 */
export class ServerGroupsController {
  constructor(public models: DB) {}

  async refreshMembership(
    options: RefreshMembershipOptions,
  ): Promise<RefreshMembershipResult> {
    return __refreshMembership.call(this, options);
  }

  async getGroups(options: GetGroupsOptions): Promise<GetGroupsResult> {
    return __getGroups.call(this, options);
  }

  async updateGroup(options: UpdateGroupOptions): Promise<UpdateGroupResult> {
    return __updateGroup.call(this, options);
  }
}
