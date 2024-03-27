import { DB, GlobalActivityCache } from '@hicommonwealth/model';
import BanCache from '../util/banCheckCache';

import {
  CreateCommentReactionOptions,
  CreateCommentReactionResult,
  __createCommentReaction,
} from './server_comments_methods/create_comment_reaction';
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
import {
  UpdateCommentOptions,
  UpdateCommentResult,
  __updateComment,
} from './server_comments_methods/update_comment';

/**
 * A controller class containing methods relating to comments
 *
 */
export class ServerCommentsController {
  constructor(
    public models: DB,
    public banCache: BanCache,
    public globalActivityCache?: GlobalActivityCache,
  ) {}

  /**
   * Creates a comment reaction with the given options.
   *
   */
  async createCommentReaction(
    options: CreateCommentReactionOptions,
  ): Promise<CreateCommentReactionResult> {
    return __createCommentReaction.call(this, options);
  }

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
   * Updates a comment.
   *
   */
  async updateComment(
    options: UpdateCommentOptions,
  ): Promise<UpdateCommentResult> {
    return __updateComment.call(this, options);
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
