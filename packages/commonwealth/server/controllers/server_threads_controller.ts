import { DB } from '@hicommonwealth/model';
import {
  CountThreadsOptions,
  CountThreadsResult,
  __countThreads,
} from './server_threads_methods/count_threads';
import {
  CreateThreadPollOptions,
  CreateThreadPollResult,
  __createThreadPoll,
} from './server_threads_methods/create_thread_poll';
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

/**
 * Implements methods related to threads
 */
export class ServerThreadsController {
  constructor(public models: DB) {}

  async getThreadsByIds(
    this: ServerThreadsController,
    options: GetThreadsByIdOptions,
  ): Promise<GetThreadsByIdResult> {
    return __getThreadsById.call(this, options);
  }

  async countThreads(
    options: CountThreadsOptions,
  ): Promise<CountThreadsResult> {
    return __countThreads.call(this, options);
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
