/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateGroupResponseGroupsItemRequirementsItemAllow } from './CreateGroupResponseGroupsItemRequirementsItemAllow';
import { CreateGroupResponseGroupsItemRequirementsItemThreshold } from './CreateGroupResponseGroupsItemRequirementsItemThreshold';
export declare const CreateGroupResponseGroupsItemRequirementsItem: core.serialization.Schema<
  serializers.CreateGroupResponseGroupsItemRequirementsItem.Raw,
  CommonApi.CreateGroupResponseGroupsItemRequirementsItem
>;
export declare namespace CreateGroupResponseGroupsItemRequirementsItem {
  type Raw =
    | CreateGroupResponseGroupsItemRequirementsItem.Threshold
    | CreateGroupResponseGroupsItemRequirementsItem.Allow;
  interface Threshold
    extends CreateGroupResponseGroupsItemRequirementsItemThreshold.Raw {
    rule: 'threshold';
  }
  interface Allow
    extends CreateGroupResponseGroupsItemRequirementsItemAllow.Raw {
    rule: 'allow';
  }
}
