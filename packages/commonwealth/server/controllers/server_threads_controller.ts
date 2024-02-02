import { DB } from '@hicommonwealth/model';
import BanCache from '../util/banCheckCache';

import { TokenBalanceCache } from '@hicommonwealth/model';
import GlobalActivityCache from '../util/globalActivityCache';

import {
  CreateThreadOptions,
  CreateThreadResult,
  __createThread,
} from './server_threads_methods/create_thread';
import {
  CreateThreadCommentOptions,
  CreateThreadCommentResult,
  __createThreadComment,
} from './server_threads_methods/create_thread_comment';
import {
  CreateThreadPollOptions,
  CreateThreadPollResult,
  __createThreadPoll,
} from './server_threads_methods/create_thread_poll';
import {
  CreateThreadReactionOptions,
  CreateThreadReactionResult,
  __createThreadReaction,
} from './server_threads_methods/create_thread_reaction';
import {
  DeleteThreadOptions,
  DeleteThreadResult,
  __deleteThread,
} from './server_threads_methods/delete_thread';
import {
  GetActiveThreadsOptions,
  GetActiveThreadsResult,
  __getActiveThreads,
} from './server_threads_methods/get_active_threads';
import {
  GetBulkThreadsOptions,
  GetBulkThreadsResult,
  __getBulkThreads,
} from './server_threads_methods/get_bulk_threads';
import {
  GetThreadPollsOptions,
  GetThreadPollsResult,
  __getThreadPolls,
} from './server_threads_methods/get_thread_polls';
import {
  GetThreadsByIdOptions,
  GetThreadsByIdResult,
  __getThreadsById,
} from './server_threads_methods/get_threads_by_id';
import {
  SearchThreadsOptions,
  SearchThreadsResult,
  __searchThreads,
} from './server_threads_methods/search_threads';
import {
  UpdateThreadOptions,
  UpdateThreadResult,
  __updateThread,
} from './server_threads_methods/update_thread';

/**
 * Implements methods related to threads
 */
export class ServerThreadsController {
  constructor(
    public models: DB,
    public tokenBalanceCache: TokenBalanceCache,
    public banCache: BanCache,
    public globalActivityCache?: GlobalActivityCache,
  ) {}

  async createThreadReaction(
    options: CreateThreadReactionOptions,
  ): Promise<CreateThreadReactionResult> {
    return __createThreadReaction.call(this, options);
  }

  async createThreadComment(
    options: CreateThreadCommentOptions,
  ): Promise<CreateThreadCommentResult> {
    return __createThreadComment.call(this, options);
  }

  async deleteThread(
    options: DeleteThreadOptions,
  ): Promise<DeleteThreadResult> {
    return __deleteThread.call(this, options);
  }

  async updateThread(
    this: ServerThreadsController,
    options: UpdateThreadOptions,
  ): Promise<UpdateThreadResult> {
    return __updateThread.call(this, options);
  }

  async createThread(
    this: ServerThreadsController,
    options: CreateThreadOptions,
  ): Promise<CreateThreadResult> {
    return __createThread.call(this, options);
  }

  async getThreadsByIds(
    this: ServerThreadsController,
    options: GetThreadsByIdOptions,
  ): Promise<GetThreadsByIdResult> {
    return __getThreadsById.call(this, options);
  }

  async getActiveThreads(
    this: ServerThreadsController,
    options: GetActiveThreadsOptions,
  ): Promise<GetActiveThreadsResult> {
    return __getActiveThreads.call(this, options);
  }

  async searchThreads(
    this: ServerThreadsController,
    options: SearchThreadsOptions,
  ): Promise<SearchThreadsResult> {
    return __searchThreads.call(this, options);
  }

  async getBulkThreads(
    options: GetBulkThreadsOptions,
  ): Promise<GetBulkThreadsResult> {
    return __getBulkThreads.call(this, options);
  }

  async createThreadPoll(
    options: CreateThreadPollOptions,
  ): Promise<CreateThreadPollResult> {
    return __createThreadPoll.call(this, options);
  }

  async getThreadPolls(
    options: GetThreadPollsOptions,
  ): Promise<GetThreadPollsResult> {
    return __getThreadPolls.call(this, options);
  }
}
