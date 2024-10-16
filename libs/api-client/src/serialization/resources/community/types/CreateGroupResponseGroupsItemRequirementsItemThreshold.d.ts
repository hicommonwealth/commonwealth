/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateGroupResponseGroupsItemRequirementsItemThresholdData } from './CreateGroupResponseGroupsItemRequirementsItemThresholdData';

export declare const CreateGroupResponseGroupsItemRequirementsItemThreshold: core.serialization.ObjectSchema<
  serializers.CreateGroupResponseGroupsItemRequirementsItemThreshold.Raw,
  CommonApi.CreateGroupResponseGroupsItemRequirementsItemThreshold
>;
export declare namespace CreateGroupResponseGroupsItemRequirementsItemThreshold {
  interface Raw {
    data: CreateGroupResponseGroupsItemRequirementsItemThresholdData.Raw;
  }
}
