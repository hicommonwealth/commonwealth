/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const UpdateCommentResponseReactionAddressUserProfileBackgroundImage: core.serialization.ObjectSchema<serializers.UpdateCommentResponseReactionAddressUserProfileBackgroundImage.Raw, CommonApi.UpdateCommentResponseReactionAddressUserProfileBackgroundImage>;
export declare namespace UpdateCommentResponseReactionAddressUserProfileBackgroundImage {
    interface Raw {
        url?: string | null;
        imageBehavior?: string | null;
    }
}
