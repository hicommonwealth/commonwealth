/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface UpdateCommentResponse {
    id?: number;
    threadId: number;
    addressId: number;
    text: string;
    plaintext: string;
    parentId?: string;
    contentUrl?: string;
    canvasSignedData?: string;
    canvasMsgId?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    markedAsSpamAt?: Date;
    discordMeta?: CommonApi.UpdateCommentResponseDiscordMeta;
    reactionCount: number;
    reactionWeightsSum?: number;
    search: CommonApi.UpdateCommentResponseSearch;
    address?: CommonApi.UpdateCommentResponseAddress;
    thread?: CommonApi.UpdateCommentResponseThread;
    reaction?: CommonApi.UpdateCommentResponseReaction;
    commentVersionHistories?: CommonApi.UpdateCommentResponseCommentVersionHistoriesItem[];
    communityId: string;
}
