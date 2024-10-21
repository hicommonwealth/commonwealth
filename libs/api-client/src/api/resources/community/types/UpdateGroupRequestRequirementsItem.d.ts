/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../index';
export declare type UpdateGroupRequestRequirementsItem =
  | CommonApi.UpdateGroupRequestRequirementsItem.Threshold
  | CommonApi.UpdateGroupRequestRequirementsItem.Allow;
export declare namespace UpdateGroupRequestRequirementsItem {
  interface Threshold
    extends CommonApi.UpdateGroupRequestRequirementsItemThreshold {
    rule: 'threshold';
  }
  interface Allow extends CommonApi.UpdateGroupRequestRequirementsItemAllow {
    rule: 'allow';
  }
}
