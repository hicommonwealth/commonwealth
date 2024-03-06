import { DB } from '@hicommonwealth/model';
import {
  GetMemberProfilesOptions,
  GetMemberProfilesResult,
  __getMemberProfiles,
} from './server_profiles_methods/get_member_profiles';
import {
  SearchProfilesOptions,
  SearchProfilesResult,
  __searchProfiles,
} from './server_profiles_methods/search_profiles';

/**
 * Implements methods related to profiles
 *
 */
export class ServerProfilesController {
  constructor(public models: DB) {}

  async searchProfiles(
    options: SearchProfilesOptions,
  ): Promise<SearchProfilesResult> {
    return __searchProfiles.call(this, options);
  }

  async getMemberProfiles(
    options: GetMemberProfilesOptions,
  ): Promise<GetMemberProfilesResult> {
    return __getMemberProfiles.call(this, options);
  }
}
