/**
 * This file was auto-generated by Fern from our API Definition.
 */
import * as core from '../../../../core';
import { GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceOne } from './GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceOne';
import { GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceThree } from './GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceThree';
import { GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenId } from './GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenId';
import { GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenSymbol } from './GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenSymbol';

export const GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSource =
  core.serialization.undiscriminatedUnion([
    GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenId,
    GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceOne,
    GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceTokenSymbol,
    GetCommunityResponseAddressesGroupsItemRequirementsItemThresholdDataSourceThree,
  ]);
