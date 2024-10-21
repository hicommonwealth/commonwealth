/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
/**
 * On-Chain Contest Manager
 */
export interface CreateCommunityResponseCommunityContestManagersItem {
  /** On-Chain contest manager address */
  contestAddress: string;
  communityId: string;
  name: string;
  imageUrl?: string;
  /** Provided by admin on creation when stake funds are not used */
  fundingTokenAddress?: string;
  /** Percentage of pool used for prizes in recurring contests */
  prizePercentage?: number;
  /** Sorted array of percentages for prize, from first to last */
  payoutStructure: number[];
  /** Recurring contest interval, 0 when one-off */
  interval: number;
  ticker?: string;
  decimals?: number;
  createdAt: Date;
  /** Flags when contest policy is cancelled by admin */
  cancelled?: boolean;
  /** Flags when the one-off contest has ended and rollover was completed */
  ended?: boolean;
  topics?: CommonApi.CreateCommunityResponseCommunityContestManagersItemTopicsItem[];
  contests?: CommonApi.CreateCommunityResponseCommunityContestManagersItemContestsItem[];
}
