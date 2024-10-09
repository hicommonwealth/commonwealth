/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const CreateCommunityResponseCommunityContestManagersItemContestsItemScoreItem: core.serialization.ObjectSchema<
  serializers.CreateCommunityResponseCommunityContestManagersItemContestsItemScoreItem.Raw,
  CommonApi.CreateCommunityResponseCommunityContestManagersItemContestsItemScoreItem
>;
export declare namespace CreateCommunityResponseCommunityContestManagersItemContestsItemScoreItem {
  interface Raw {
    creator_address: string;
    content_id: string;
    votes: number;
    prize: string;
    tickerPrize?: number | null;
  }
}
