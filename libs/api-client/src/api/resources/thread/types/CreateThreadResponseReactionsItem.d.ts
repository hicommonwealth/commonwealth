/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
export interface CreateThreadResponseReactionsItem {
  id?: number;
  addressId: number;
  reaction: 'like';
  threadId?: number;
  commentId?: number;
  proposalId?: number;
  calculatedVotingWeight?: number;
  canvasSignedData?: unknown;
  canvasMsgId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  address?: CommonApi.CreateThreadResponseReactionsItemAddress;
}
