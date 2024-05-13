import { DB } from '@hicommonwealth/model';
import BanCache from '../util/banCheckCache';
import { GetTagsResult, __getTags } from './server_tags_methods/get_tags';

/**
 * Implements methods related to tags
 */
export class ServerTagsController {
  constructor(public models: DB, public banCache: BanCache) {}

  async getTags(): Promise<GetTagsResult> {
    return __getTags.call(this);
  }
}
