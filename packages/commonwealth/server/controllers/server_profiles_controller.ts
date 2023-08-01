import { DB } from 'server/models';
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
    options: SearchProfilesOptions
  ): Promise<SearchProfilesResult> {
    return __searchProfiles.call(this, options);
  }
}
