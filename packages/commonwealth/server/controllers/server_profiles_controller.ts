import { DB } from '@hicommonwealth/model';
import {
  GetMemberProfilesOptions as GetCommunityMembersOptions,
  GetCommunityMembersResult,
  __getCommunityMembers,
} from './server_profiles_methods/get_community_members';
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

  async getCommunityMembers(
    options: GetCommunityMembersOptions,
  ): Promise<GetCommunityMembersResult> {
    return __getCommunityMembers.call(this, options);
  }
}
