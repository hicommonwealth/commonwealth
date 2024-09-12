import { DB, GlobalActivityCache } from '@hicommonwealth/model';
import {
  DeleteCommentOptions,
  DeleteCommentResult,
  __deleteComment,
} from './server_comments_methods/delete_comment';
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
  constructor(
    public models: DB,
    public globalActivityCache?: GlobalActivityCache,
  ) {}

  /**
   * Returns comment search results.
   *
   */
  async searchComments(
    options: SearchCommentsOptions,
  ): Promise<SearchCommentsResult> {
    return __searchComments.call(this, options);
  }

  /**
   * Deletes a comment.
   *
   */
  async deleteComment(
    options: DeleteCommentOptions,
  ): Promise<DeleteCommentResult> {
    return __deleteComment.call(this, options);
  }
}
