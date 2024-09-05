import { DB } from '@hicommonwealth/model';
// eslint-disable-next-line import/no-cycle
import { GetTagsResult, __getTags } from './server_tags_methods/get_tags';

/**
 * Implements methods related to tags
 */
export class ServerTagsController {
  constructor(public models: DB) {}

  async getTags(): Promise<GetTagsResult> {
    return await __getTags.call(this);
  }
}
