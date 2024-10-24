/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateGroupResponseTopicsItemContestTopicsItem: core.serialization.ObjectSchema<
  serializers.CreateGroupResponseTopicsItemContestTopicsItem.Raw,
  CommonApi.CreateGroupResponseTopicsItemContestTopicsItem
>;
export declare namespace CreateGroupResponseTopicsItemContestTopicsItem {
  interface Raw {
    contest_address: string;
    topic_id: number;
    created_at: string;
  }
}
