/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../index';
/**
 * @example
 *     {
 *         threadId: 1
 *     }
 */
export interface GetCommentsRequest {
  limit?: string;
  /**
   * required for tRPC useInfiniteQuery hook, equivalent to page number
   */
  cursor?: string;
  orderBy?: string;
  orderDirection?: CommonApi.GetCommentsRequestOrderDirection;
  threadId: number;
  commentId?: number;
  includeUser?: boolean;
  includeReactions?: boolean;
}
