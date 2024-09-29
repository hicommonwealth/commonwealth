/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as CommonApi from "../../../index";
export interface GetCommentsResponseResultsItemThreadAddress {
    id?: number;
    address: string;
    communityId: string;
    userId?: number;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    verified?: Date;
    lastActive?: Date;
    ghostAddress?: boolean;
    walletId?: CommonApi.GetCommentsResponseResultsItemThreadAddressWalletId;
    blockInfo?: string;
    isUserDefault?: boolean;
    role?: CommonApi.GetCommentsResponseResultsItemThreadAddressRole;
    isBanned?: boolean;
    hex?: string;
    user?: CommonApi.GetCommentsResponseResultsItemThreadAddressUser;
    createdAt?: Date;
    updatedAt?: Date;
}
