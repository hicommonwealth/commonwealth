/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as serializers from "../../../index";
import * as CommonApi from "../../../../api/index";
import * as core from "../../../../core";
export declare const GetCommentsResponseResultsItemThreadLinksItemSource: core.serialization.Schema<serializers.GetCommentsResponseResultsItemThreadLinksItemSource.Raw, CommonApi.GetCommentsResponseResultsItemThreadLinksItemSource>;
export declare namespace GetCommentsResponseResultsItemThreadLinksItemSource {
    type Raw = "snapshot" | "proposal" | "thread" | "web" | "template";
}
