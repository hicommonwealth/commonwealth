/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from '../../../../api/index';
import * as core from '../../../../core';
import * as serializers from '../../../index';
import { CreateCommentResponseThreadReactionsItemAddressUserProfileBackgroundImage } from './CreateCommentResponseThreadReactionsItemAddressUserProfileBackgroundImage';

export declare const CreateCommentResponseThreadReactionsItemAddressUserProfile: core.serialization.ObjectSchema<
  serializers.CreateCommentResponseThreadReactionsItemAddressUserProfile.Raw,
  CommonApi.CreateCommentResponseThreadReactionsItemAddressUserProfile
>;
export declare namespace CreateCommentResponseThreadReactionsItemAddressUserProfile {
  interface Raw {
    name?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    slug?: string | null;
    socials?: string[] | null;
    background_image?: CreateCommentResponseThreadReactionsItemAddressUserProfileBackgroundImage.Raw | null;
  }
}
