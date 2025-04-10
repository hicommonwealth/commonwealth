import { DB } from '@hicommonwealth/model';
import {
  AdminTagResponse,
  TagUsageResponse,
  __createAdminTag,
  __deleteAdminTag,
  __getAdminTags,
  __getTagUsage,
  __updateAdminTag,
} from './server_tags_methods/admin_tags';
import { GetTagsResult, __getTags } from './server_tags_methods/get_tags';

/**
 * Implements methods related to tags
 */
export class ServerTagsController {
  constructor(public models: DB) {}

  async getTags(): Promise<GetTagsResult> {
    return await __getTags.call(this);
  }

  // Admin tag management methods
  async getAdminTags(): Promise<AdminTagResponse[]> {
    return await __getAdminTags.call(this);
  }

  async createAdminTag(name: string): Promise<AdminTagResponse> {
    return await __createAdminTag.call(this, name);
  }

  async updateAdminTag(id: number, name: string): Promise<AdminTagResponse> {
    return await __updateAdminTag.call(this, id, name);
  }

  async deleteAdminTag(id: number): Promise<void> {
    return await __deleteAdminTag.call(this, id);
  }

  async getTagUsage(id: number): Promise<TagUsageResponse> {
    return await __getTagUsage.call(this, id);
  }
}
