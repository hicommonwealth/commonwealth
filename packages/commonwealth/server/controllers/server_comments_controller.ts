import { DB } from '@hicommonwealth/model';
import {
  SearchCommentsOptions,
  SearchCommentsResult,
  __searchComments,
} from './server_comments_methods/search_comments';

/**
 * A controller class containing methods relating to comments
 *
 */
export class ServerCommentsController {
  constructor(public models: DB) {}

  /**
   * Returns comment search results.
   *
   */
  async searchComments(
    options: SearchCommentsOptions,
  ): Promise<SearchCommentsResult> {
    return __searchComments.call(this, options);
  }
}
