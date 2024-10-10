/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { UpdateGroupResponseRequirementsItemAllowData } from './UpdateGroupResponseRequirementsItemAllowData';

export declare const UpdateGroupResponseRequirementsItemAllow: core.serialization.ObjectSchema<
  serializers.UpdateGroupResponseRequirementsItemAllow.Raw,
  CommonApi.UpdateGroupResponseRequirementsItemAllow
>;
export declare namespace UpdateGroupResponseRequirementsItemAllow {
  interface Raw {
    data: UpdateGroupResponseRequirementsItemAllowData.Raw;
  }
}
