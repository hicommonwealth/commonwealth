/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const CreateCommunityResponseCommunityCommunityTagsItemTag: core.serialization.ObjectSchema<serializers.CreateCommunityResponseCommunityCommunityTagsItemTag.Raw, CommonApi.CreateCommunityResponseCommunityCommunityTagsItemTag>;
export declare namespace CreateCommunityResponseCommunityCommunityTagsItemTag {
    interface Raw {
        id?: number | null;
        name: string;
    }
}
