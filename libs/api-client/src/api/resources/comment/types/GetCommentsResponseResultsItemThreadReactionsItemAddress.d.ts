/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface GetCommentsResponseResultsItemThreadReactionsItemAddress {
    id?: number;
    address: string;
    communityId: string;
    userId?: number;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    verified?: Date;
    lastActive?: Date;
    ghostAddress?: boolean;
    walletId?: CommonApi.GetCommentsResponseResultsItemThreadReactionsItemAddressWalletId;
    blockInfo?: string;
    isUserDefault?: boolean;
    role?: CommonApi.GetCommentsResponseResultsItemThreadReactionsItemAddressRole;
    isBanned?: boolean;
    hex?: string;
    user?: CommonApi.GetCommentsResponseResultsItemThreadReactionsItemAddressUser;
    createdAt?: Date;
    updatedAt?: Date;
}
