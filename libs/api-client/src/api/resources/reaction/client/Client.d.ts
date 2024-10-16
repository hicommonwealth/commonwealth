/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import * as environments from '../../../../environments';
import * as CommonApi from '../../../index';
export declare namespace Reaction {
  interface Options {
    environment?: core.Supplier<environments.CommonApiEnvironment | string>;
    apiKey: core.Supplier<string>;
    /** Override the address header */
    address?: core.Supplier<string | undefined>;
  }
  interface RequestOptions {
    /** The maximum time to wait for a response in seconds. */
    timeoutInSeconds?: number;
    /** The number of times to retry the request. Defaults to 2. */
    maxRetries?: number;
    /** A hook to abort the request. */
    abortSignal?: AbortSignal;
    /** Override the address header */
    address?: string | undefined;
  }
}
export declare class Reaction {
  protected readonly _options: Reaction.Options;
  constructor(_options: Reaction.Options);
  /**
   * @param {CommonApi.CreateThreadReactionRequest} request
   * @param {Reaction.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @example
   *     await client.reaction.createThreadReaction({
   *         threadId: 1
   *     })
   */
  createThreadReaction(
    request: CommonApi.CreateThreadReactionRequest,
    requestOptions?: Reaction.RequestOptions,
  ): Promise<CommonApi.CreateThreadReactionResponse>;
  /**
   * @param {CommonApi.CreateCommentReactionRequest} request
   * @param {Reaction.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @example
   *     await client.reaction.createCommentReaction({
   *         commentId: 1
   *     })
   */
  createCommentReaction(
    request: CommonApi.CreateCommentReactionRequest,
    requestOptions?: Reaction.RequestOptions,
  ): Promise<CommonApi.CreateCommentReactionResponse>;
  /**
   * @param {CommonApi.DeleteReactionRequest} request
   * @param {Reaction.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @example
   *     await client.reaction.deleteReaction({
   *         communityId: "community_id",
   *         reactionId: 1
   *     })
   */
  deleteReaction(
    request: CommonApi.DeleteReactionRequest,
    requestOptions?: Reaction.RequestOptions,
  ): Promise<CommonApi.DeleteReactionResponse>;
  protected _getCustomAuthorizationHeaders(): Promise<{
    'x-api-key': string;
  }>;
}
