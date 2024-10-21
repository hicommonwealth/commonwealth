/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
export declare const CreateThreadResponseCollaboratorsItemUserProfileBackgroundImage: core.serialization.ObjectSchema<
  serializers.CreateThreadResponseCollaboratorsItemUserProfileBackgroundImage.Raw,
  CommonApi.CreateThreadResponseCollaboratorsItemUserProfileBackgroundImage
>;
export declare namespace CreateThreadResponseCollaboratorsItemUserProfileBackgroundImage {
  interface Raw {
    url?: string | null;
    imageBehavior?: string | null;
  }
}
