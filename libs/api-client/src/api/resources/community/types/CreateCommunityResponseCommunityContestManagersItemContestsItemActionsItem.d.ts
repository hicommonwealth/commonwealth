/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';

/**
 * On-Chain content related actions on contest instance
 */
export interface CreateCommunityResponseCommunityContestManagersItemContestsItemActionsItem {
  /** On-Chain contest manager address */
  contestAddress: string;
  /** On-Chain contest id, 0 when one-off */
  contestId: number;
  /** On-Chain content id, 0 when adding */
  contentId: number;
  actorAddress: string;
  /** Type of content action */
  action: CommonApi.CreateCommunityResponseCommunityContestManagersItemContestsItemActionsItemAction;
  /** Content url */
  contentUrl?: string;
  /** Thread id mapped from content url */
  threadId?: number;
  threadTitle?: string;
  /** Voting power of address when action was recorded */
  votingPower: number;
  /** Date-time when action was recorded */
  createdAt: Date;
}
