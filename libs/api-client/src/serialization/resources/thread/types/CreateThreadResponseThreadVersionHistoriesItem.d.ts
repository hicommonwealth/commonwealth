/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';

export declare const CreateThreadResponseThreadVersionHistoriesItem: core.serialization.ObjectSchema<
  serializers.CreateThreadResponseThreadVersionHistoriesItem.Raw,
  CommonApi.CreateThreadResponseThreadVersionHistoriesItem
>;
export declare namespace CreateThreadResponseThreadVersionHistoriesItem {
  interface Raw {
    id?: number | null;
    thread_id: number;
    address: string;
    body: string;
    timestamp: string;
    content_url?: string | null;
  }
}
