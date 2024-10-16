/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateThreadResponseAddressUserProfileBackgroundImage } from './CreateThreadResponseAddressUserProfileBackgroundImage';

export declare const CreateThreadResponseAddressUserProfile: core.serialization.ObjectSchema<
  serializers.CreateThreadResponseAddressUserProfile.Raw,
  CommonApi.CreateThreadResponseAddressUserProfile
>;
export declare namespace CreateThreadResponseAddressUserProfile {
  interface Raw {
    name?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    socials?: string[] | null;
    background_image?: CreateThreadResponseAddressUserProfileBackgroundImage.Raw | null;
  }
}
